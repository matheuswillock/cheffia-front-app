import {
  AccountApprovalStatus,
  FinancialReconciliationStatus,
  OrderPaymentStatus,
  PayoutTransferStatus,
  type PrismaClient,
} from "@prisma/client";
import { prisma as defaultPrisma, withPrismaRetry } from "@/server/infra/prisma";
import { failOutput, okOutput, type Output } from "@/server/shared/output";
import type { RestaurantFinancialSummaryOutput } from "./types";

const roundCurrency = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
const toNumber = (value: { toString(): string } | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
};

export class RestaurantFinancialSummaryService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async getSummary(
    tenantId: string,
    restaurantId: string
  ): Promise<Output<RestaurantFinancialSummaryOutput>> {
    try {
      const now = new Date();
      const [account, payments, payouts, documents, mismatchCount, lastRun] = await Promise.all([
        withPrismaRetry(
          () =>
            this.prisma.restaurantFinancialAccount.findFirst({
              where: {
                tenantId,
                restaurantId,
                provider: "asaas",
              },
              select: {
                id: true,
                onboardingStatus: true,
                lastStatusSyncAt: true,
              },
            }),
          { label: "financialSummary.account" }
        ),
        withPrismaRetry(
          () =>
            this.prisma.restaurantPayment.findMany({
              where: {
                tenantId,
                restaurantId,
                provider: "asaas",
              },
              select: {
                status: true,
                netAmount: true,
                availableAt: true,
                paymentDate: true,
              },
            }),
          { label: "financialSummary.payments" }
        ),
        withPrismaRetry(
          () =>
            this.prisma.restaurantPayoutTransfer.findMany({
              where: {
                tenantId,
                restaurantId,
              },
              select: {
                status: true,
                amount: true,
                scheduledFor: true,
              },
            }),
          { label: "financialSummary.payouts" }
        ),
        withPrismaRetry(
          () =>
            this.prisma.restaurantFinancialOnboardingDocument.findMany({
              where: {
                tenantId,
                restaurantId,
              },
              select: {
                status: true,
              },
            }),
          { label: "financialSummary.documents" }
        ),
        withPrismaRetry(
          () =>
            this.prisma.financialReconciliationItem.count({
              where: {
                tenantId,
                restaurantId,
                status: {
                  in: [
                    FinancialReconciliationStatus.mismatched,
                    FinancialReconciliationStatus.failed,
                  ],
                },
              },
            }),
          { label: "financialSummary.mismatchCount" }
        ),
        withPrismaRetry(
          () =>
            this.prisma.financialReconciliationRun.findFirst({
              where: {
                tenantId,
                restaurantId,
              },
              orderBy: [{ updatedAt: "desc" }],
              select: {
                updatedAt: true,
              },
            }),
          { label: "financialSummary.lastRun" }
        ),
      ]);

      const pendingPixAmount = roundCurrency(
        payments
          .filter((payment) =>
            payment.status === OrderPaymentStatus.pending || payment.status === OrderPaymentStatus.processing
          )
          .reduce((sum, payment) => sum + toNumber(payment.netAmount), 0)
      );

      const receivedAmount = roundCurrency(
        payments
          .filter((payment) => payment.status === OrderPaymentStatus.paid)
          .reduce((sum, payment) => sum + toNumber(payment.netAmount), 0)
      );

      const availableAmount = roundCurrency(
        payments
          .filter(
            (payment) =>
              payment.status === OrderPaymentStatus.paid &&
              payment.availableAt !== null &&
              payment.availableAt <= now
          )
          .reduce((sum, payment) => sum + toNumber(payment.netAmount), 0)
      );

      const scheduledPayoutAmount = roundCurrency(
        payouts
          .filter((payout) =>
            payout.status === PayoutTransferStatus.scheduled || payout.status === PayoutTransferStatus.processing
          )
          .reduce((sum, payout) => sum + toNumber(payout.amount), 0)
      );

      const pendingDocumentsCount = documents.filter(
        (document) =>
          document.status === AccountApprovalStatus.pending ||
          document.status === AccountApprovalStatus.awaiting_approval
      ).length;
      const rejectedDocumentsCount = documents.filter(
        (document) => document.status === AccountApprovalStatus.rejected
      ).length;

      const lastPaymentAt = payments
        .map((payment) => payment.paymentDate)
        .filter((value): value is Date => value instanceof Date)
        .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;

      const nextPayoutAt = payouts
        .filter((payout) =>
          payout.status === PayoutTransferStatus.scheduled || payout.status === PayoutTransferStatus.processing
        )
        .map((payout) => payout.scheduledFor)
        .sort((left, right) => left.getTime() - right.getTime())[0] ?? null;

      return okOutput({
        restaurantId,
        financialAccountId: account?.id ?? null,
        onboardingStatus: account?.onboardingStatus ?? "draft",
        currency: "BRL",
        pendingPixAmount,
        receivedAmount,
        availableAmount,
        scheduledPayoutAmount,
        pendingDocumentsCount,
        rejectedDocumentsCount,
        reconciliationMismatchCount: mismatchCount,
        lastStatusSyncAt: account?.lastStatusSyncAt?.toISOString() ?? null,
        lastPaymentAt: lastPaymentAt?.toISOString() ?? null,
        lastReconciliationAt: lastRun?.updatedAt?.toISOString() ?? null,
        nextPayoutAt: nextPayoutAt?.toISOString() ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      return failOutput(`Failed to load restaurant financial summary: ${message}`);
    }
  }
}

