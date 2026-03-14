import { randomInt } from "crypto";
import {
  FeeValueType,
  FinancialEntryDirection,
  FinancialLedgerEntryType,
  OrderPaymentStatus,
  OrderStatus,
  PaymentMethod,
  PayoutTransferStatus,
  SettlementStrategy,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";
import { OutboxEventsService } from "@/app/api/useCases/events";
import { FinancialReconciliationService } from "@/app/api/useCases/financialAccounts/financialReconciliationService";
import { AsaasClient } from "@/app/api/infra/external/asaas";
import { prisma as defaultPrisma, withPrismaRetry } from "@/app/api/infra/prisma";
import { failOutput, okOutput, type Output } from "@/lib/server/output";
import {
  buildPaymentLedgerTransition,
  computeAvailableAt as computeAvailableAtFromDomain,
  computeNetAmount as computeNetAmountFromDomain,
  computePlatformFeeAmount as computePlatformFeeAmountFromDomain,
  computeProviderFeeAmount as computeProviderFeeAmountFromDomain,
  hasSamePayerProfile,
  normalizeDigits,
  type PayerProfile,
  validateAndBuildPayerProfile,
} from "@/app/api/services/domain/financial";
import type {
  InputConfirmPayment,
  InputPaymentOrder,
  InputRequestOrder,
  OrderItemOutput,
  OrderOutput,
  OutputConfirmPaymentStatus,
  PaymentOrderOutput,
  SendOrderOutput,
} from "./types";

type MenuItemReference = {
  id: string;
  name: string;
  price: Prisma.Decimal;
};

type AsaasPaymentSnapshot = {
  id: string;
  status: string | null;
  customer: string | null;
  billingType: string | null;
  value: number | null;
  netValue: number | null;
  paymentDate: Date | null;
  availableAt: Date | null;
  externalReference: string | null;
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  rawPayload: Prisma.InputJsonValue;
};

type ApplyAsaasPaymentStateResult = {
  paymentId: string;
  status: OrderPaymentStatus;
  confirmationAt: string;
};

type SettlementRuleContext = {
  id: string;
  financialAccountId: string | null;
  destinationWalletId: string | null;
  settlementStrategy: SettlementStrategy;
  platformFeeType: FeeValueType;
  platformFeeValue: number;
  transferDelayDays: number;
};

const toNumber = (value: Prisma.Decimal | number | string | null): number => {
  if (value === null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number(value.toString());
};

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const toIso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const readDate = (value: unknown): Date | null => {
  const raw = readString(value);
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const hasTimeZone = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(normalized);
  const candidate =
    /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00.000Z` : hasTimeZone ? normalized : `${normalized}Z`;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const readNestedRecord = (
  value: Record<string, unknown>,
  key: string
): Record<string, unknown> | null => {
  const nested = value[key];
  return nested && typeof nested === "object" ? (nested as Record<string, unknown>) : null;
};

const parseExternalReferenceOrderId = (value: string | null): string | null => {
  if (!value) return null;

  const tenantOrderMatch = value.match(/(?:^|:)order:([0-9a-fA-F-]{36})(?:$|:)/);
  if (tenantOrderMatch?.[1]) return tenantOrderMatch[1];

  const rawUuidMatch = value.match(/\b[0-9a-fA-F-]{36}\b/);
  return rawUuidMatch?.[0] ?? null;
};

const parseIntegerEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value?.trim() ?? "");
  return Number.isInteger(parsed) ? parsed : fallback;
};

const parseDecimalEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value?.trim() ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getDefaultSettlementStrategy = (): SettlementStrategy => {
  const raw = (process.env.ASAAS_DEFAULT_SETTLEMENT_STRATEGY ?? "").trim().toLowerCase();
  return raw === SettlementStrategy.transferencia_posterior
    ? SettlementStrategy.transferencia_posterior
    : SettlementStrategy.split_automatico;
};

const getDefaultPlatformFeeType = (): FeeValueType => {
  const raw = (process.env.ASAAS_DEFAULT_PLATFORM_FEE_TYPE ?? "").trim().toLowerCase();
  return raw === FeeValueType.fixed ? FeeValueType.fixed : FeeValueType.percentage;
};

const getDefaultPlatformFeeValue = (): number =>
  roundCurrency(parseDecimalEnv(process.env.ASAAS_DEFAULT_PLATFORM_FEE_VALUE, 0));

const getDefaultTransferDelayDays = (): number =>
  Math.max(0, parseIntegerEnv(process.env.ASAAS_DEFAULT_TRANSFER_DELAY_DAYS, 0));

const getDefaultSourceWalletId = (): string | null => readString(process.env.ASAAS_MAIN_WALLET_ID);

const toOrderStatusEnum = (value: string | null | undefined): OrderStatus => {
  if (!value) return OrderStatus.pending;

  const normalized = value.trim().toLowerCase();
  if (normalized === "inprogress" || normalized === "in_progress") return OrderStatus.in_progress;
  if (normalized === "ready") return OrderStatus.ready;
  if (normalized === "cancelled" || normalized === "canceled") return OrderStatus.cancelled;
  return OrderStatus.pending;
};

const statusLabelMap: Record<OrderPaymentStatus, string> = {
  [OrderPaymentStatus.pending]: "Pending",
  [OrderPaymentStatus.completed]: "Completed",
  [OrderPaymentStatus.paid]: "Paid",
  [OrderPaymentStatus.canceled]: "Canceled",
  [OrderPaymentStatus.expired]: "Expired",
  [OrderPaymentStatus.processing]: "Processing",
  [OrderPaymentStatus.refunded]: "Refunded",
  [OrderPaymentStatus.rejected]: "Rejected",
  [OrderPaymentStatus.failed]: "Failed",
  [OrderPaymentStatus.unknown]: "Unknown",
};

const mapAsaasStatusToOrderPaymentStatus = (status: string | null | undefined): OrderPaymentStatus => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase();

  if (
    normalized === "RECEIVED" ||
    normalized === "CONFIRMED" ||
    normalized === "RECEIVED_IN_CASH" ||
    normalized === "RECEIVED_WITHOUT_RISK"
  ) {
    return OrderPaymentStatus.paid;
  }
  if (normalized === "PENDING" || normalized === "AWAITING_PAYMENT" || normalized === "CREATED") {
    return OrderPaymentStatus.pending;
  }
  if (normalized === "OVERDUE") return OrderPaymentStatus.expired;
  if (normalized === "REFUNDED" || normalized === "PARTIALLY_REFUNDED") {
    return OrderPaymentStatus.refunded;
  }
  if (normalized === "CANCELED" || normalized === "DELETED") return OrderPaymentStatus.canceled;
  if (normalized === "RECEIVED_PENDING_RISK_ANALYSIS") {
    return OrderPaymentStatus.processing;
  }
  return OrderPaymentStatus.unknown;
};

const normalizeWebhookStatusToAsaasStatus = (
  status: unknown,
  eventType?: string | null
): string | null => {
  const direct = readString(status);
  if (direct) return direct;

  const normalizedEventType = String(eventType ?? "")
    .trim()
    .toUpperCase();
  if (!normalizedEventType.startsWith("PAYMENT_")) return null;

  return normalizedEventType.replace(/^PAYMENT_/, "");
};

const mapBillingTypeToPaymentMethod = (billingType: string | null | undefined): PaymentMethod => {
  switch (String(billingType ?? "").trim().toUpperCase()) {
    case "PIX":
      return PaymentMethod.pix;
    case "CREDIT_CARD":
      return PaymentMethod.credit_card;
    case "BOLETO":
      return PaymentMethod.bank_transfer;
    default:
      return PaymentMethod.unknown;
  }
};

const buildAsaasPaymentSnapshot = (
  payload: Record<string, unknown>,
  eventType?: string | null
): AsaasPaymentSnapshot | null => {
  const paymentRecord =
    readNestedRecord(payload, "payment") ??
    readNestedRecord(payload, "data") ??
    payload;
  const id = readString(paymentRecord.id) ?? readString(paymentRecord.paymentId);
  if (!id) return null;

  const status = normalizeWebhookStatusToAsaasStatus(paymentRecord.status, eventType);
  const value = readNumber(paymentRecord.value);
  const netValue =
    readNumber(paymentRecord.netValue) ??
    readNumber(paymentRecord.netAmount) ??
    readNumber(paymentRecord.receivedValue);

  return {
    id,
    status,
    customer: readString(paymentRecord.customer),
    billingType: readString(paymentRecord.billingType),
    value,
    netValue,
    paymentDate:
      readDate(paymentRecord.paymentDate) ??
      readDate(paymentRecord.clientPaymentDate) ??
      readDate(paymentRecord.confirmedDate),
    availableAt:
      readDate(paymentRecord.creditDate) ??
      readDate(paymentRecord.estimatedCreditDate) ??
      readDate(paymentRecord.clientPaymentDate),
    externalReference: readString(paymentRecord.externalReference),
    pixQrCode: readString(paymentRecord.pixQrCode) ?? readString(paymentRecord.brCode),
    pixCopyPaste:
      readString(paymentRecord.pixCopyAndPaste) ?? readString(paymentRecord.brCodeBase64),
    rawPayload: paymentRecord as Prisma.InputJsonValue,
  };
};

const mapOrderItemOutput = (
  item: {
    name: string;
    price: Prisma.Decimal;
    quantity: number;
    comments: string;
    tableNumber: string;
    orderNumber: number;
  }[]
): OrderItemOutput[] =>
  item.map((row) => ({
    itemName: row.name,
    price: roundCurrency(toNumber(row.price)),
    quantity: row.quantity,
    comments: row.comments,
    tableNumber: row.tableNumber,
    orderNumber: row.orderNumber,
  }));

const buildAsaasChargeOutput = (
  charge: Record<string, unknown>,
  amount: number,
  fallbackDescription: string,
  platformFeeAmount = 0
): PaymentOrderOutput => {
  const chargeId =
    (typeof charge.id === "string" ? charge.id : null) ??
    (typeof charge.paymentId === "string" ? charge.paymentId : null) ??
    "";
  const rawStatus = typeof charge.status === "string" ? charge.status : null;
  const createdAt =
    (typeof charge.dateCreated === "string" ? charge.dateCreated : null) ?? new Date().toISOString();
  const updatedAt =
    (typeof charge.lastUpdated === "string" ? charge.lastUpdated : null) ??
    (typeof charge.updatedAt === "string" ? charge.updatedAt : null) ??
    createdAt;
  const expiresAt =
    (typeof charge.clientPaymentDate === "string" ? charge.clientPaymentDate : null) ??
    (typeof charge.dueDate === "string" ? charge.dueDate : null);
  const brCode =
    (typeof charge.pixQrCode === "string" ? charge.pixQrCode : null) ??
    (typeof charge.brCode === "string" ? charge.brCode : null);
  const brCodeBase64 =
    (typeof charge.pixCopyAndPaste === "string" ? charge.pixCopyAndPaste : null) ??
    (typeof charge.brCodeBase64 === "string" ? charge.brCodeBase64 : null);
  const description =
    (typeof charge.description === "string" ? charge.description : null) ?? fallbackDescription;

  return {
    error: null,
    data: {
      amount: Math.round(roundCurrency(amount) * 100),
      status: statusLabelMap[mapAsaasStatusToOrderPaymentStatus(rawStatus)],
      method: "pix",
      brCode,
      brCodeBase64,
      platformFee: Math.round(roundCurrency(platformFeeAmount) * 100),
      description,
      createdAt: toIso(createdAt),
      updatedAt: toIso(updatedAt),
      expiresAt: expiresAt ? toIso(expiresAt) : null,
      id: chargeId,
    },
  };
};

const toAsaasDate = (value: Date): string => {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export class OrderHubService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly asaas: AsaasClient = new AsaasClient(),
    private readonly outboxEvents: OutboxEventsService = new OutboxEventsService(),
    private readonly reconciliation: FinancialReconciliationService = new FinancialReconciliationService()
  ) {}

  public async getTenantByRestaurantId(restaurantId: string): Promise<string | null> {
    const row = await withPrismaRetry(
      () =>
        this.prisma.restaurant.findUnique({
          where: { id: restaurantId },
          select: { tenantId: true },
        }),
      { label: "orderhub.getTenantByRestaurantId" }
    );
    return row?.tenantId ?? null;
  }

  public async getTenantByCustomerOrderId(customerOrderId: string): Promise<string | null> {
    const row = await withPrismaRetry(
      () =>
        this.prisma.customerOrder.findUnique({
          where: { id: customerOrderId },
          select: { tenantId: true },
        }),
      { label: "orderhub.getTenantByCustomerOrderId" }
    );
    return row?.tenantId ?? null;
  }

  public async getTenantByTransactionId(paymentPixId: string): Promise<string | null> {
    const row = await withPrismaRetry(
      () =>
        this.prisma.customerOrderPaymentDetail.findFirst({
          where: {
            OR: [{ transactionId: paymentPixId }, { providerPaymentId: paymentPixId }],
          },
          select: { tenantId: true },
        }),
      { label: "orderhub.getTenantByTransactionId" }
    );
    return row?.tenantId ?? null;
  }

  private async getRestaurantFinancialAccountId(
    tenantId: string,
    restaurantId: string
  ): Promise<string | null> {
    const row = await withPrismaRetry(
      () =>
        this.prisma.restaurantFinancialAccount.findFirst({
          where: {
            tenantId,
            restaurantId,
            provider: "asaas",
          },
          select: {
            id: true,
          },
        }),
      { label: "orderhub.getRestaurantFinancialAccountId" }
    );

    return row?.id ?? null;
  }

  private async getRestaurantFinancialAccountSnapshot(
    tenantId: string,
    restaurantId: string
  ): Promise<{ id: string; asaasWalletId: string | null } | null> {
    return withPrismaRetry(
      () =>
        this.prisma.restaurantFinancialAccount.findFirst({
          where: {
            tenantId,
            restaurantId,
            provider: "asaas",
          },
          select: {
            id: true,
            asaasWalletId: true,
          },
        }),
      { label: "orderhub.getRestaurantFinancialAccountSnapshot" }
    );
  }

  private async resolveSettlementRuleContext(
    tenantId: string,
    restaurantId: string,
    financialAccountId: string | null
  ): Promise<SettlementRuleContext> {
    const now = new Date();
    const accountSnapshot = await this.getRestaurantFinancialAccountSnapshot(tenantId, restaurantId);
    const resolvedFinancialAccountId = financialAccountId ?? accountSnapshot?.id ?? null;

    const activeRule = await withPrismaRetry(
      () =>
        this.prisma.restaurantFinancialSettlementRule.findFirst({
          where: {
            tenantId,
            restaurantId,
            active: true,
            effectiveFrom: { lte: now },
            OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
          },
          orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            financialAccountId: true,
            settlementStrategy: true,
            platformFeeType: true,
            platformFeeValue: true,
            transferDelayDays: true,
            financialAccount: {
              select: {
                asaasWalletId: true,
              },
            },
          },
        }),
      { label: "orderhub.resolveSettlementRuleContext.findActiveRule" }
    );

    if (activeRule) {
      return {
        id: activeRule.id,
        financialAccountId: activeRule.financialAccountId ?? resolvedFinancialAccountId,
        destinationWalletId:
          activeRule.financialAccount?.asaasWalletId ?? accountSnapshot?.asaasWalletId ?? null,
        settlementStrategy: activeRule.settlementStrategy,
        platformFeeType: activeRule.platformFeeType,
        platformFeeValue: roundCurrency(toNumber(activeRule.platformFeeValue)),
        transferDelayDays: activeRule.transferDelayDays,
      };
    }

    const createdRule = await withPrismaRetry(
      () =>
        this.prisma.restaurantFinancialSettlementRule.create({
          data: {
            tenantId,
            restaurantId,
            financialAccountId: resolvedFinancialAccountId,
            provider: "asaas",
            settlementStrategy: getDefaultSettlementStrategy(),
            platformFeeType: getDefaultPlatformFeeType(),
            platformFeeValue: getDefaultPlatformFeeValue(),
            transferDelayDays: getDefaultTransferDelayDays(),
            active: true,
            metadata: {
              source: "orderhub-default",
            },
            effectiveFrom: now,
          },
          select: {
            id: true,
            financialAccountId: true,
            settlementStrategy: true,
            platformFeeType: true,
            platformFeeValue: true,
            transferDelayDays: true,
          },
        }),
      { label: "orderhub.resolveSettlementRuleContext.createDefaultRule" }
    );

    return {
      id: createdRule.id,
      financialAccountId: createdRule.financialAccountId ?? resolvedFinancialAccountId,
      destinationWalletId: accountSnapshot?.asaasWalletId ?? null,
      settlementStrategy: createdRule.settlementStrategy,
      platformFeeType: createdRule.platformFeeType,
      platformFeeValue: roundCurrency(toNumber(createdRule.platformFeeValue)),
      transferDelayDays: createdRule.transferDelayDays,
    };
  }

  private async upsertLedgerEntry(
    tx: Prisma.TransactionClient,
    input: {
      tenantId: string;
      restaurantId: string;
      financialAccountId: string | null;
      customerOrderId: string | null;
      paymentDetailId: string | null;
      payoutTransferId?: string | null;
      providerReference: string;
      entryType: FinancialLedgerEntryType;
      direction: FinancialEntryDirection;
      grossAmount: number;
      netAmount: number;
      feeAmount: number;
      occurredAt: Date;
      metadata?: Prisma.InputJsonValue;
    }
  ): Promise<void> {
    const existing = await tx.financialLedgerEntry.findFirst({
      where: {
        tenantId: input.tenantId,
        provider: "asaas",
        providerReference: input.providerReference,
      },
      select: { id: true },
    });

    if (existing) {
      await tx.financialLedgerEntry.update({
        where: { id: existing.id },
        data: {
          financialAccountId: input.financialAccountId,
          customerOrderId: input.customerOrderId,
          paymentDetailId: input.paymentDetailId,
          payoutTransferId: input.payoutTransferId ?? null,
          entryType: input.entryType,
          direction: input.direction,
          grossAmount: roundCurrency(input.grossAmount),
          netAmount: roundCurrency(input.netAmount),
          feeAmount: roundCurrency(input.feeAmount),
          occurredAt: input.occurredAt,
          metadata: input.metadata,
        },
      });
      return;
    }

    await tx.financialLedgerEntry.create({
      data: {
        tenantId: input.tenantId,
        restaurantId: input.restaurantId,
        financialAccountId: input.financialAccountId,
        customerOrderId: input.customerOrderId,
        paymentDetailId: input.paymentDetailId,
        payoutTransferId: input.payoutTransferId ?? null,
        provider: "asaas",
        providerReference: input.providerReference,
        entryType: input.entryType,
        direction: input.direction,
        grossAmount: roundCurrency(input.grossAmount),
        netAmount: roundCurrency(input.netAmount),
        feeAmount: roundCurrency(input.feeAmount),
        occurredAt: input.occurredAt,
        metadata: input.metadata,
      },
    });
  }

  private async applyAsaasPaymentSnapshot(
    tenantId: string,
    snapshot: AsaasPaymentSnapshot
  ): Promise<ApplyAsaasPaymentStateResult> {
    const paymentDetail = await withPrismaRetry(
      async () => {
        const byPaymentId = await this.prisma.customerOrderPaymentDetail.findFirst({
          where: {
            tenantId,
            OR: [{ transactionId: snapshot.id }, { providerPaymentId: snapshot.id }],
          },
          select: {
            id: true,
            tenantId: true,
            customerOrderId: true,
            financialAccountId: true,
            transactionId: true,
            providerCustomerId: true,
            providerPaymentId: true,
            billingType: true,
            status: true,
            method: true,
            amount: true,
            grossAmount: true,
            netAmount: true,
            platformFeeAmount: true,
            providerFeeAmount: true,
            pixQrCode: true,
            pixCopyPaste: true,
            externalReference: true,
            providerRawStatus: true,
            paymentDate: true,
            customerOrder: {
              select: {
                id: true,
                totalToPay: true,
                restaurant: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        });

        if (byPaymentId) return byPaymentId;

        const orderId = parseExternalReferenceOrderId(snapshot.externalReference);
        if (!orderId) return null;

        return this.prisma.customerOrderPaymentDetail.findFirst({
          where: {
            tenantId,
            customerOrderId: orderId,
          },
          select: {
            id: true,
            tenantId: true,
            customerOrderId: true,
            financialAccountId: true,
            transactionId: true,
            providerCustomerId: true,
            providerPaymentId: true,
            billingType: true,
            status: true,
            method: true,
            amount: true,
            grossAmount: true,
            netAmount: true,
            platformFeeAmount: true,
            providerFeeAmount: true,
            pixQrCode: true,
            pixCopyPaste: true,
            externalReference: true,
            providerRawStatus: true,
            paymentDate: true,
            customerOrder: {
              select: {
                id: true,
                totalToPay: true,
                restaurant: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        });
      },
      { label: "orderhub.applyAsaasPaymentSnapshot.findPaymentDetail" }
    );

    if (!paymentDetail) {
      throw new Error(`Customer order payment detail not found for Asaas payment ${snapshot.id}.`);
    }

    const now = new Date();
    const mappedStatus = mapAsaasStatusToOrderPaymentStatus(snapshot.status);
    const mappedMethod = mapBillingTypeToPaymentMethod(snapshot.billingType);
    const resolvedMethod =
      mappedMethod !== PaymentMethod.unknown ? mappedMethod : paymentDetail.method;
    const settlementContext = await this.resolveSettlementRuleContext(
      tenantId,
      paymentDetail.customerOrder.restaurant.id,
      paymentDetail.financialAccountId
    );
    const resolvedAmount = roundCurrency(
      snapshot.value ?? toNumber(paymentDetail.amount ?? paymentDetail.customerOrder.totalToPay)
    );
    const resolvedGrossAmount = roundCurrency(
      snapshot.value ?? toNumber(paymentDetail.grossAmount ?? paymentDetail.amount ?? paymentDetail.customerOrder.totalToPay)
    );
    const resolvedProviderFeeAmount = computeProviderFeeAmountFromDomain(
      resolvedGrossAmount,
      snapshot.netValue,
      paymentDetail.providerFeeAmount !== null ? toNumber(paymentDetail.providerFeeAmount) : null
    );
    const resolvedPlatformFeeAmount = computePlatformFeeAmountFromDomain(
      resolvedGrossAmount,
      settlementContext.platformFeeType,
      settlementContext.platformFeeValue
    );
    const resolvedNetAmount = computeNetAmountFromDomain(
      resolvedGrossAmount,
      resolvedProviderFeeAmount,
      resolvedPlatformFeeAmount
    );
    const resolvedPaymentDate =
      snapshot.paymentDate ??
      paymentDetail.paymentDate ??
      (mappedStatus === OrderPaymentStatus.paid ? now : null);
    const resolvedFinancialAccountId =
      paymentDetail.financialAccountId ?? settlementContext.financialAccountId;
    const resolvedAvailableAt = computeAvailableAtFromDomain({
      settlementStrategy: settlementContext.settlementStrategy,
      transferDelayDays: settlementContext.transferDelayDays,
      paymentDate: resolvedPaymentDate,
      providerAvailableAt: snapshot.availableAt,
    });
    const shouldPersistRestaurantPayment =
      mappedStatus === OrderPaymentStatus.paid ||
      mappedStatus === OrderPaymentStatus.refunded ||
      mappedStatus === OrderPaymentStatus.canceled;
    const wasPaid = paymentDetail.status === OrderPaymentStatus.paid;
    const ledgerTransition = buildPaymentLedgerTransition({
      paymentId: snapshot.id,
      paymentStatus: mappedStatus,
      grossAmount: resolvedGrossAmount,
      netAmount: resolvedNetAmount,
      providerFeeAmount: resolvedProviderFeeAmount,
      platformFeeAmount: resolvedPlatformFeeAmount,
      occurredAt: resolvedPaymentDate ?? now,
      settlementRuleId: settlementContext.id,
      settlementStrategy: settlementContext.settlementStrategy,
      platformFeeType: settlementContext.platformFeeType,
      platformFeeValue: settlementContext.platformFeeValue,
      destinationWalletId: settlementContext.destinationWalletId,
      sourceWalletId: getDefaultSourceWalletId(),
      scheduledFor: resolvedAvailableAt,
    });

    await withPrismaRetry(
      () =>
        this.prisma.$transaction(async (tx) => {
          await tx.customerOrderPaymentDetail.update({
            where: { id: paymentDetail.id },
            data: {
              financialAccountId: resolvedFinancialAccountId,
              transactionId: snapshot.id,
              providerCustomerId: snapshot.customer ?? paymentDetail.providerCustomerId,
              providerPaymentId: snapshot.id,
              billingType: snapshot.billingType ?? paymentDetail.billingType,
              status: mappedStatus,
              method: resolvedMethod,
              amount: resolvedAmount,
              grossAmount: resolvedGrossAmount,
              netAmount: resolvedNetAmount,
              platformFeeAmount: resolvedPlatformFeeAmount,
              providerFeeAmount: resolvedProviderFeeAmount,
              pixQrCode: snapshot.pixQrCode ?? paymentDetail.pixQrCode,
              pixCopyPaste: snapshot.pixCopyPaste ?? paymentDetail.pixCopyPaste,
              externalReference: snapshot.externalReference ?? paymentDetail.externalReference,
              providerRawStatus: snapshot.status ?? paymentDetail.providerRawStatus,
              paymentDate:
                resolvedPaymentDate ?? paymentDetail.paymentDate,
              lastProviderSyncAt: now,
            },
          });
          await this.reconciliation.reconcilePaymentSnapshot(tx, {
            tenantId,
            restaurantId: paymentDetail.customerOrder.restaurant.id,
            financialAccountId: resolvedFinancialAccountId,
            customerOrderId: paymentDetail.customerOrder.id,
            paymentDetailId: paymentDetail.id,
            providerReference: snapshot.id,
            internalSnapshot: {
              status: mappedStatus,
              grossAmount: resolvedGrossAmount,
              netAmount: resolvedNetAmount,
            },
            providerSnapshot: {
              status: mapAsaasStatusToOrderPaymentStatus(snapshot.status),
              grossAmount: snapshot.value ?? resolvedGrossAmount,
              netAmount: snapshot.netValue ?? resolvedNetAmount,
              rawPayload: snapshot.rawPayload,
            },
          });

          const existingRestaurantPayment = await tx.restaurantPayment.findFirst({
            where: {
              tenantId,
              transactionId: snapshot.id,
            },
            select: {
              id: true,
            },
          });

          if (existingRestaurantPayment) {
            await tx.restaurantPayment.update({
              where: { id: existingRestaurantPayment.id },
              data: {
                financialAccountId: resolvedFinancialAccountId,
                paymentDate: resolvedPaymentDate,
                amount: resolvedAmount,
                grossAmount: resolvedGrossAmount,
                netAmount: resolvedNetAmount,
                platformFeeAmount: resolvedPlatformFeeAmount,
                providerFeeAmount: resolvedProviderFeeAmount,
                method: resolvedMethod,
                status: mappedStatus,
                settlementStrategy: settlementContext.settlementStrategy,
                providerRawStatus: snapshot.status,
                availableAt: resolvedAvailableAt,
                paymentDetails: snapshot.rawPayload,
              },
            });
          } else if (shouldPersistRestaurantPayment) {
            await tx.restaurantPayment.create({
              data: {
                tenantId,
                restaurantId: paymentDetail.customerOrder.restaurant.id,
                customerOrderId: paymentDetail.customerOrder.id,
                financialAccountId: resolvedFinancialAccountId,
                paymentDate: resolvedPaymentDate,
                amount: resolvedAmount,
                grossAmount: resolvedGrossAmount,
                netAmount: resolvedNetAmount,
                platformFeeAmount: resolvedPlatformFeeAmount,
                providerFeeAmount: resolvedProviderFeeAmount,
                transactionId: snapshot.id,
                method: resolvedMethod,
                status: mappedStatus,
                settlementStrategy: settlementContext.settlementStrategy,
                providerRawStatus: snapshot.status,
                availableAt: resolvedAvailableAt,
                provider: "asaas",
                paymentDetails: snapshot.rawPayload,
              },
            });
          }

          let payoutTransferId: string | null = null;

          if (
            mappedStatus === OrderPaymentStatus.paid ||
            mappedStatus === OrderPaymentStatus.refunded ||
            mappedStatus === OrderPaymentStatus.canceled
          ) {
            if (
              mappedStatus === OrderPaymentStatus.paid &&
              settlementContext.settlementStrategy === SettlementStrategy.transferencia_posterior &&
              resolvedNetAmount > 0 &&
              !settlementContext.destinationWalletId
            ) {
              throw new Error(
                `Missing destination wallet for payout scheduling on restaurant ${paymentDetail.customerOrder.restaurant.id}.`
              );
            }

            if (ledgerTransition.payoutTransfer) {
              const existingPayout = await tx.restaurantPayoutTransfer.findFirst({
                where: {
                  tenantId,
                  customerOrderId: paymentDetail.customerOrder.id,
                  financialAccountId: resolvedFinancialAccountId,
                },
                orderBy: [{ createdAt: "desc" }],
                select: {
                  id: true,
                },
              });

              const payoutTransfer = existingPayout
                ? await tx.restaurantPayoutTransfer.update({
                    where: { id: existingPayout.id },
                    data: {
                      amount: ledgerTransition.payoutTransfer.amount,
                      currency: ledgerTransition.payoutTransfer.currency,
                      status: PayoutTransferStatus.scheduled,
                      sourceWalletId: ledgerTransition.payoutTransfer.sourceWalletId,
                      destinationWalletId: ledgerTransition.payoutTransfer.destinationWalletId,
                      scheduledFor: ledgerTransition.payoutTransfer.scheduledFor,
                      lastError: null,
                      metadata: {
                        paymentDetailId: paymentDetail.id,
                        transactionId: snapshot.id,
                        settlementRuleId: settlementContext.id,
                      },
                    },
                    select: {
                      id: true,
                    },
                  })
                : await tx.restaurantPayoutTransfer.create({
                    data: {
                      tenantId,
                      restaurantId: paymentDetail.customerOrder.restaurant.id,
                      financialAccountId: resolvedFinancialAccountId,
                      customerOrderId: paymentDetail.customerOrder.id,
                      amount: ledgerTransition.payoutTransfer.amount,
                      currency: ledgerTransition.payoutTransfer.currency,
                      status: PayoutTransferStatus.scheduled,
                      sourceWalletId: ledgerTransition.payoutTransfer.sourceWalletId,
                      destinationWalletId: ledgerTransition.payoutTransfer.destinationWalletId,
                      scheduledFor: ledgerTransition.payoutTransfer.scheduledFor,
                      metadata: {
                        paymentDetailId: paymentDetail.id,
                        transactionId: snapshot.id,
                        settlementRuleId: settlementContext.id,
                      },
                    },
                    select: {
                      id: true,
                    },
                  });

              payoutTransferId = payoutTransfer.id;
            }

            if (
              mappedStatus === OrderPaymentStatus.refunded ||
              mappedStatus === OrderPaymentStatus.canceled
            ) {
              const pendingPayout = await tx.restaurantPayoutTransfer.findFirst({
                where: {
                  tenantId,
                  customerOrderId: paymentDetail.customerOrder.id,
                  financialAccountId: resolvedFinancialAccountId,
                  status: {
                    in: [PayoutTransferStatus.scheduled, PayoutTransferStatus.processing],
                  },
                },
                orderBy: [{ createdAt: "desc" }],
                select: {
                  id: true,
                },
              });

              if (pendingPayout) {
                await tx.restaurantPayoutTransfer.update({
                  where: { id: pendingPayout.id },
                  data: {
                    status: PayoutTransferStatus.canceled,
                    lastError: `Transfer canceled because payment moved to ${mappedStatus}.`,
                  },
                });
              }
            }

            for (const ledgerEntry of ledgerTransition.ledgerEntries) {
              await this.upsertLedgerEntry(tx, {
                tenantId,
                restaurantId: paymentDetail.customerOrder.restaurant.id,
                financialAccountId: resolvedFinancialAccountId,
                customerOrderId: paymentDetail.customerOrder.id,
                paymentDetailId: paymentDetail.id,
                payoutTransferId:
                  ledgerEntry.entryType === "payout_scheduled" ? payoutTransferId : null,
                providerReference: ledgerEntry.providerReference,
                entryType: ledgerEntry.entryType as FinancialLedgerEntryType,
                direction: ledgerEntry.direction as FinancialEntryDirection,
                grossAmount: ledgerEntry.grossAmount,
                netAmount: ledgerEntry.netAmount,
                feeAmount: ledgerEntry.feeAmount,
                occurredAt: ledgerEntry.occurredAt,
                metadata: ledgerEntry.metadata as Prisma.InputJsonValue | undefined,
              });
            }
          }

          if (!wasPaid && mappedStatus === OrderPaymentStatus.paid) {
            await this.outboxEvents.enqueueOrderPaymentConfirmed(tx, {
              tenantId,
              customerOrderId: paymentDetail.customerOrder.id,
              restaurantId: paymentDetail.customerOrder.restaurant.id,
              transactionId: snapshot.id,
              status: snapshot.status ?? "UNKNOWN",
            });
          }
        }),
      { label: "orderhub.applyAsaasPaymentSnapshot.tx" }
    );

    return {
      paymentId: snapshot.id,
      status: mappedStatus,
      confirmationAt: now.toISOString(),
    };
  }

  public async handlePaymentWebhook(
    tenantId: string,
    payload: Record<string, unknown>,
    eventType: string
  ): Promise<ApplyAsaasPaymentStateResult> {
    const snapshot = buildAsaasPaymentSnapshot(payload, eventType);
    if (!snapshot) {
      throw new Error(`Asaas webhook ${eventType} does not contain a valid payment id.`);
    }

    return this.applyAsaasPaymentSnapshot(tenantId, snapshot);
  }

  public async sendOrder(
    tenantId: string,
    input: InputRequestOrder
  ): Promise<Output<SendOrderOutput | null>> {
    try {
      if (!input.orderItems.length) {
        return failOutput("Order must have at least one item.");
      }

      const restaurant = await withPrismaRetry(
        () =>
          this.prisma.restaurant.findFirst({
            where: { id: input.restaurantId, tenantId },
            select: { id: true },
          }),
        { label: "orderhub.sendOrder.restaurant" }
      );

      if (!restaurant) {
        return failOutput("Restaurant not found");
      }

      const menu = await withPrismaRetry(
        () =>
          this.prisma.menu.findFirst({
            where: { tenantId, restaurantId: input.restaurantId },
            select: { id: true },
          }),
        { label: "orderhub.sendOrder.menu" }
      );

      if (!menu) {
        return failOutput("Menu not found");
      }

      const menuItemIds = Array.from(new Set(input.orderItems.map((item) => item.menuItemId)));

      const menuItems = await withPrismaRetry(
        () =>
          this.prisma.menuItem.findMany({
            where: {
              tenantId,
              menuId: menu.id,
              id: { in: menuItemIds },
            },
            select: {
              id: true,
              name: true,
              price: true,
            },
          }),
        { label: "orderhub.sendOrder.menuItems" }
      );

      if (menuItems.length !== menuItemIds.length) {
        return failOutput("Some items are not available in the restaurant menu");
      }

      const menuItemsById = new Map<string, MenuItemReference>(menuItems.map((item) => [item.id, item]));

      const updatedOrder = await withPrismaRetry(
        () =>
          this.prisma.$transaction(async (tx) => {
            const existingOrder = input.customerOrderId
              ? await tx.customerOrder.findFirst({
                  where: {
                    id: input.customerOrderId,
                    tenantId,
                    restaurantId: input.restaurantId,
                  },
                  include: {
                    items: true,
                    paymentDetail: true,
                  },
                })
              : null;

            const order =
              existingOrder ??
              (await tx.customerOrder.create({
                data: {
                  id: input.customerOrderId ?? undefined,
                  tenantId,
                  restaurantId: input.restaurantId,
                  orderDate: new Date(),
                  tableNumber: input.tableNumber,
                  orderNumber: randomInt(0, 10_000),
                  totalToPay: 0,
                },
                include: {
                  items: true,
                  paymentDetail: true,
                },
              }));

            for (const orderItemInput of input.orderItems) {
              const menuItem = menuItemsById.get(orderItemInput.menuItemId);
              if (!menuItem) {
                throw new Error(`Menu item with ID ${orderItemInput.menuItemId} not found in the menu.`);
              }

              const existingItem = order.items.find(
                (item) =>
                  item.menuItemId === orderItemInput.menuItemId &&
                  item.orderNumber === order.orderNumber &&
                  item.customerOrderId === order.id
              );

              const orderStatus = toOrderStatusEnum(orderItemInput.orderStatus);
              const comments = orderItemInput.comments.trim();
              const tableNumber = orderItemInput.tableNumber || input.tableNumber;

              if (existingItem) {
                const updated = await tx.customerOrderItem.update({
                  where: { id: existingItem.id },
                  data: {
                    name: menuItem.name,
                    price: menuItem.price,
                    quantity: existingItem.quantity + Math.max(1, orderItemInput.quantity),
                    comments,
                    tableNumber,
                    orderStatus,
                  },
                });

                const idx = order.items.findIndex((item) => item.id === existingItem.id);
                if (idx >= 0) order.items[idx] = updated;
                continue;
              }

              const created = await tx.customerOrderItem.create({
                data: {
                  tenantId,
                  customerOrderId: order.id,
                  menuItemId: orderItemInput.menuItemId,
                  orderNumber: order.orderNumber,
                  name: menuItem.name,
                  orderStatus,
                  price: menuItem.price,
                  tableNumber,
                  quantity: Math.max(1, orderItemInput.quantity),
                  comments,
                },
              });
              order.items.push(created);
            }

            const refreshedItems = await tx.customerOrderItem.findMany({
              where: { tenantId, customerOrderId: order.id },
              orderBy: { createdAt: "asc" },
            });

            const totalToPay = roundCurrency(
              refreshedItems.reduce((sum, item) => sum + toNumber(item.price) * item.quantity, 0)
            );

            const savedOrder = await tx.customerOrder.update({
              where: { id: order.id },
              data: {
                tableNumber: input.tableNumber,
                totalToPay,
              },
              include: {
                items: {
                  orderBy: { createdAt: "asc" },
                },
                paymentDetail: true,
              },
            });

            if (!savedOrder.paymentDetail) {
              await tx.customerOrderPaymentDetail.create({
                data: {
                  tenantId,
                  customerOrderId: savedOrder.id,
                  status: OrderPaymentStatus.pending,
                  method: PaymentMethod.unknown,
                  amount: totalToPay,
                  provider: "asaas",
                },
              });
            }

            await this.outboxEvents.enqueueOrderSent(tx, {
              tenantId,
              customerOrderId: savedOrder.id,
              restaurantId: savedOrder.restaurantId,
              orderNumber: savedOrder.orderNumber,
              tableNumber: savedOrder.tableNumber,
            });

            return savedOrder;
          }),
        { label: "orderhub.sendOrder.tx" }
      );

      const output: SendOrderOutput = {
        customerOrderId: updatedOrder.id,
        restaurantId: updatedOrder.restaurantId,
        orderDate: updatedOrder.orderDate.toISOString(),
        orderItems: mapOrderItemOutput(updatedOrder.items),
      };

      return okOutput(output, ["Order sent to kitchen"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Error while sending order - ${message}`);
    }
  }

  public async getOrder(
    tenantId: string,
    restaurantId: string,
    customerOrderId: string
  ): Promise<Output<OrderOutput[]>> {
    try {
      const orders = await withPrismaRetry(
        () =>
          this.prisma.customerOrder.findMany({
            where: {
              tenantId,
              restaurantId,
              id: customerOrderId,
            },
            include: {
              items: {
                orderBy: { createdAt: "asc" },
              },
            },
          }),
        { label: "orderhub.getOrder" }
      );

      if (!orders.length) {
        return failOutput("No orders found for the given restaurant or customer order ID.");
      }

      const output: OrderOutput[] = orders.map((order) => ({
        customerOrderId: order.id,
        restaurantId: order.restaurantId,
        orderDate: order.orderDate.toISOString(),
        orderItems: mapOrderItemOutput(order.items),
        totalToPay: roundCurrency(toNumber(order.totalToPay)),
        tableNumber: order.tableNumber,
        orderNumber: order.orderNumber,
      }));

      return okOutput(output, ["Orders retrieved successfully"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Error while getting orders - ${message}`);
    }
  }

  public async createPayment(
    tenantId: string,
    input: InputPaymentOrder
  ): Promise<Output<PaymentOrderOutput | null>> {
    try {
      const payerValidation = validateAndBuildPayerProfile(input.payer);
      if (!payerValidation.profile) {
        return failOutput(
          `Invalid payer information: ${payerValidation.errors.join(", ") || "payer payload is incomplete"}`
        );
      }

      const payerProfile: PayerProfile = payerValidation.profile;
      const order = await withPrismaRetry(
        () =>
          this.prisma.customerOrder.findFirst({
            where: {
              id: input.customerOrderId,
              tenantId,
            },
            include: {
              restaurant: {
                select: {
                  id: true,
                },
              },
              paymentDetail: true,
            },
          }),
        { label: "orderhub.createPayment.order" }
      );

      if (!order) {
        return failOutput("Customer order not found");
      }

      if (order.paymentDetail && order.paymentDetail.status !== OrderPaymentStatus.pending) {
        return failOutput("Order payment has already been processed or is not pending.");
      }

      let amount = roundCurrency(toNumber(order.totalToPay));
      if (input.payTip) {
        amount = roundCurrency(amount + amount * 0.1);
      }

      if (amount <= 0) {
        return failOutput("Order amount must be greater than zero.");
      }

      const settlementContext = await this.resolveSettlementRuleContext(
        tenantId,
        order.restaurant.id,
        order.paymentDetail?.financialAccountId ?? null
      );
      const platformFeeAmount = computePlatformFeeAmountFromDomain(
        amount,
        settlementContext.platformFeeType,
        settlementContext.platformFeeValue
      );
      const expectedNetAmount = roundCurrency(amount - platformFeeAmount);
      const externalReference = `tenant:${tenantId}:order:${order.id}`;
      const description = `Pedido ${order.orderNumber} - Mesa ${order.tableNumber}`;

      const canReuseProviderCustomer =
        Boolean(order.paymentDetail?.providerCustomerId) &&
        Boolean(order.paymentDetail?.payerName) &&
        hasSamePayerProfile(payerProfile, {
          name: order.paymentDetail?.payerName ?? "",
          normalizedPhoneNumber: normalizeDigits(order.paymentDetail?.payerPhoneNumber),
          email: order.paymentDetail?.payerEmail ?? null,
          normalizedDocument: normalizeDigits(order.paymentDetail?.payerDocument) || null,
        });

      const providerCustomerId = canReuseProviderCustomer
        ? order.paymentDetail?.providerCustomerId ?? null
        : (
            await this.asaas.createCustomer(
              {
                name: payerProfile.name,
                email: payerProfile.email ?? undefined,
                cpfCnpj: payerProfile.document ?? undefined,
                mobilePhone: payerProfile.normalizedPhoneNumber,
              },
              { tenantId }
            )
          ).id;

      if (!providerCustomerId) {
        return failOutput("Unable to resolve Asaas customer for PIX charge.");
      }

      const charge = await this.asaas.createCharge(
        {
          customer: providerCustomerId,
          billingType: "PIX",
          value: amount,
          dueDate: toAsaasDate(new Date()),
          description,
          externalReference,
        },
        { tenantId }
      );
      const chargeRecord = charge as unknown as Record<string, unknown>;

      await withPrismaRetry(
        () =>
          this.prisma.$transaction(async (tx) => {
            await tx.customerOrder.update({
              where: { id: order.id },
              data: { totalToPay: amount },
            });

            const paymentDetail = await tx.customerOrderPaymentDetail.upsert({
              where: { customerOrderId: order.id },
              create: {
                tenantId,
                customerOrderId: order.id,
                financialAccountId: settlementContext.financialAccountId,
                transactionId: charge.id,
                providerCustomerId,
                payerName: payerProfile.name,
                payerPhoneNumber: payerProfile.phoneNumber,
                payerEmail: payerProfile.email,
                payerDocument: payerProfile.document,
                providerPaymentId: charge.id,
                status: OrderPaymentStatus.pending,
                method: PaymentMethod.pix,
                amount,
                grossAmount: amount,
                netAmount: expectedNetAmount,
                platformFeeAmount,
                billingType: charge.billingType,
                externalReference,
                providerRawStatus: charge.status,
                pixQrCode: chargeRecord.pixQrCode as string | undefined,
                pixCopyPaste:
                  (chargeRecord.pixCopyAndPaste as string | undefined) ??
                  (chargeRecord.brCodeBase64 as string | undefined),
                provider: "asaas",
                paymentDate: null,
              },
              update: {
                financialAccountId: settlementContext.financialAccountId,
                transactionId: charge.id,
                providerCustomerId,
                payerName: payerProfile.name,
                payerPhoneNumber: payerProfile.phoneNumber,
                payerEmail: payerProfile.email,
                payerDocument: payerProfile.document,
                providerPaymentId: charge.id,
                status: OrderPaymentStatus.pending,
                method: PaymentMethod.pix,
                amount,
                grossAmount: amount,
                netAmount: expectedNetAmount,
                platformFeeAmount,
                billingType: charge.billingType,
                externalReference,
                providerRawStatus: charge.status,
                pixQrCode: chargeRecord.pixQrCode as string | undefined,
                pixCopyPaste:
                  (chargeRecord.pixCopyAndPaste as string | undefined) ??
                  (chargeRecord.brCodeBase64 as string | undefined),
                provider: "asaas",
                paymentDate: null,
              },
            });

            await this.upsertLedgerEntry(tx, {
              tenantId,
              restaurantId: order.restaurant.id,
              financialAccountId: settlementContext.financialAccountId,
              customerOrderId: order.id,
              paymentDetailId: paymentDetail.id,
              providerReference: `payment:${charge.id}:charge_created`,
              entryType: FinancialLedgerEntryType.charge_created,
              direction: FinancialEntryDirection.credit,
              grossAmount: amount,
              netAmount: expectedNetAmount,
              feeAmount: platformFeeAmount,
              occurredAt: new Date(),
              metadata: {
                settlementRuleId: settlementContext.id,
                payerName: payerProfile.name,
                externalReference,
              },
            });

            await this.outboxEvents.enqueueOrderPaymentRequested(tx, {
              tenantId,
              customerOrderId: order.id,
              restaurantId: order.restaurant.id,
              transactionId: charge.id,
              status: charge.status,
            });
          }),
        { label: "orderhub.createPayment.tx" }
      );

      return okOutput(
        buildAsaasChargeOutput(chargeRecord, amount, description, platformFeeAmount),
        ["Payment Pix generated successfully"]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Error while processing payment - ${message}`);
    }
  }

  public async confirmPayment(
    tenantId: string,
    input: InputConfirmPayment
  ): Promise<Output<OutputConfirmPaymentStatus>> {
    try {
      const paymentDetails = await withPrismaRetry(
        () =>
          this.prisma.customerOrderPaymentDetail.findFirst({
            where: {
              tenantId,
              transactionId: input.paymentPixId,
            },
            include: {
              customerOrder: {
                include: {
                  restaurant: {
                    select: { id: true },
                  },
                },
              },
            },
          }),
        { label: "orderhub.confirmPayment.details" }
      );

      if (!paymentDetails) {
        return failOutput("Customer order payment details not found for payment Pix ID");
      }

      if (paymentDetails.status === OrderPaymentStatus.paid) {
        return okOutput(
          {
            status: statusLabelMap[OrderPaymentStatus.paid],
            confirmationAt: new Date().toISOString(),
          },
          ["Payment Pix already confirmed as 'paid'"]
        );
      }

      const asaasPayment = await this.asaas.getPayment(input.paymentPixId, { tenantId });
      const snapshot = buildAsaasPaymentSnapshot(
        asaasPayment as unknown as Record<string, unknown>
      );
      if (!snapshot) {
        return failOutput("Asaas payment response does not contain a valid payment id");
      }

      const applied = await this.applyAsaasPaymentSnapshot(tenantId, snapshot);

      if (applied.status !== OrderPaymentStatus.paid) {
        return okOutput(
          {
            status: statusLabelMap[applied.status],
            confirmationAt: applied.confirmationAt,
          },
          [`Payment Pix status is not 'paid', current status: ${statusLabelMap[applied.status]}`]
        );
      }

      return okOutput(
        {
          status: statusLabelMap[applied.status],
          confirmationAt: applied.confirmationAt,
        },
        ["Payment Pix confirmed successfully"]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Error while confirming payment Pix - ${message}`);
    }
  }
}















