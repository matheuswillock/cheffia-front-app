import { FinancialOnboardingStatus, type PrismaClient } from "@prisma/client";
import { RestaurantFinancialOnboardingDocumentService } from "@/server/application/financialAccounts/restaurantFinancialOnboardingDocumentService";
import {
  mapApprovalStatus,
  mapOnboardingStatus,
  parseAsaasDateTime,
} from "@/server/application/financialAccounts/statusMapping";
import { OrderHubService } from "@/server/application/orderhub";
import { prisma as defaultPrisma, withPrismaRetry } from "@/server/infra/prisma";
import { getSupabaseAdminClient } from "@/server/infra/supabase/adminClient";
import {
  getAccountStatusIdFromPayload,
  getEventType,
  getProviderEventId,
  readString,
} from "./asaasWebhookPayload";

type EventStatus = "pending" | "processing" | "processed" | "failed";

interface AsaasWebhookEventRow {
  id: string;
  tenant_id: string;
  provider: string;
  provider_event_id: string;
  event_type: string;
  raw_payload: Record<string, unknown>;
  raw_headers: Record<string, string>;
  signature_validated: boolean;
  status: EventStatus;
  processing_attempts: number;
  first_received_at: string;
  last_received_at: string;
  processed_at: string | null;
  last_error: string | null;
}

interface AsaasAccountStatusSnapshot {
  id: string;
  commercialInfo: string | null;
  bankAccountInfo: string | null;
  documentation: string | null;
  general: string | null;
}

export interface ProcessIncomingAsaasWebhookInput {
  tenantId: string;
  payload: Record<string, unknown>;
  rawHeaders: Record<string, string>;
  signatureValidated: boolean;
}

export interface ProcessIncomingAsaasWebhookResult {
  accepted: true;
  replayed: boolean;
  processing: boolean;
  providerEventId: string;
  eventType: string;
  internalState: string;
}

const ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON =
  "ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON";
const ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED = "ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED";

const eventToState = (eventType: string): string => {
  const normalized = eventType.toUpperCase();

  if (normalized.startsWith("ACCOUNT_STATUS_")) {
    return normalized.toLowerCase();
  }

  if (normalized.includes("CONFIRMED")) return "payment_confirmed";
  if (normalized.includes("RECEIVED")) return "payment_received";
  if (normalized.includes("OVERDUE")) return "payment_overdue";
  if (normalized.includes("REFUNDED")) return "payment_refunded";
  if (normalized.includes("DELETED")) return "payment_deleted";

  return "event_received";
};

const isAccountStatusEvent = (eventType: string): boolean =>
  eventType.toUpperCase().startsWith("ACCOUNT_STATUS");

const getAccountStatusSnapshot = (
  payload: Record<string, unknown>
): AsaasAccountStatusSnapshot | null => {
  const raw = payload.accountStatus;
  if (!raw || typeof raw !== "object") return null;

  const accountStatus = raw as Record<string, unknown>;
  const id = readString(accountStatus.id);
  if (!id) return null;

  return {
    id,
    commercialInfo: readString(accountStatus.commercialInfo),
    bankAccountInfo: readString(accountStatus.bankAccountInfo),
    documentation: readString(accountStatus.documentation),
    general: readString(accountStatus.general),
  };
};

const getAdditionalInfoScheduledDate = (payload: Record<string, unknown>): string | null => {
  const additionalInfo = payload.additionalInfo;
  if (!additionalInfo || typeof additionalInfo !== "object") return null;
  return readString((additionalInfo as Record<string, unknown>).scheduledDate);
};

export class AsaasWebhookService {
  constructor(
    private readonly prisma: PrismaClient = defaultPrisma,
    private readonly financialDocuments: RestaurantFinancialOnboardingDocumentService = new RestaurantFinancialOnboardingDocumentService(),
    private readonly orderHub: OrderHubService = new OrderHubService()
  ) {}

  private async handleAccountStatusEvent(
    tenantId: string,
    payload: Record<string, unknown>,
    eventType: string
  ): Promise<void> {
    const snapshot = getAccountStatusSnapshot(payload);
    if (!snapshot?.id) {
      throw new Error(`Asaas webhook ${eventType} is missing accountStatus.id.`);
    }

    const financialAccount = await withPrismaRetry(
      () =>
        this.prisma.restaurantFinancialAccount.findFirst({
          where: {
            tenantId,
            provider: "asaas",
            asaasAccountId: snapshot.id,
          },
          select: {
            id: true,
            restaurantId: true,
            commercialInfoIsExpired: true,
            commercialInfoExpirationScheduledAt: true,
          },
        }),
      { label: "webhooks.asaas.handleAccountStatus.findAccount" }
    );

    if (!financialAccount) {
      throw new Error(`Financial account not found for Asaas account ${snapshot.id}.`);
    }

    const normalizedEventType = eventType.toUpperCase();
    const commercialInfoStatus = mapApprovalStatus(snapshot.commercialInfo);
    const bankAccountStatus = mapApprovalStatus(snapshot.bankAccountInfo);
    const documentationStatus = mapApprovalStatus(snapshot.documentation);
    const generalStatus = mapApprovalStatus(snapshot.general);
    const scheduledDateRaw = getAdditionalInfoScheduledDate(payload);
    const scheduledDate = parseAsaasDateTime(scheduledDateRaw);
    const commercialInfoIsExpired =
      normalizedEventType === ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED
        ? true
        : normalizedEventType === ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON
          ? false
          : financialAccount.commercialInfoIsExpired;
    const onboardingStatus = mapOnboardingStatus({
      general: generalStatus,
      documentation: documentationStatus,
      commercialInfoExpired: commercialInfoIsExpired,
    });
    const now = new Date();

    await withPrismaRetry(
      () =>
        this.prisma.$transaction(async (tx) => {
          await tx.restaurantFinancialAccount.update({
            where: { id: financialAccount.id },
            data: {
              commercialInfoStatus,
              bankAccountStatus,
              documentationStatus,
              generalStatus,
              onboardingStatus,
              commercialInfoIsExpired,
              commercialInfoExpirationScheduledAt:
                scheduledDateRaw !== null
                  ? scheduledDate
                  : financialAccount.commercialInfoExpirationScheduledAt,
              lastStatusSyncAt: now,
              lastError: null,
            },
          });

          if (onboardingStatus === FinancialOnboardingStatus.approved) {
            await tx.restaurant.update({
              where: { id: financialAccount.restaurantId },
              data: {
                financialOnboardingCompletedAt: now,
              },
            });
          }
        }),
      { label: "webhooks.asaas.handleAccountStatus.apply" }
    );

    const synced = await this.financialDocuments.syncDocuments(
      tenantId,
      financialAccount.restaurantId
    );
    if (!synced.isValid) {
      throw new Error(synced.errorMessages.join("; "));
    }
  }

  private async processBusinessEvent(
    tenantId: string,
    payload: Record<string, unknown>,
    eventType: string
  ): Promise<string> {
    if (isAccountStatusEvent(eventType)) {
      await this.handleAccountStatusEvent(tenantId, payload, eventType);
      return eventToState(eventType);
    }

    if (eventType.toUpperCase().startsWith("PAYMENT_")) {
      await this.orderHub.handlePaymentWebhook(tenantId, payload, eventType);
    }

    return eventToState(eventType);
  }

  public async processIncoming(
    input: ProcessIncomingAsaasWebhookInput
  ): Promise<ProcessIncomingAsaasWebhookResult> {
    const supabase = getSupabaseAdminClient();
    const eventType = getEventType(input.payload);
    const providerEventId = getProviderEventId(input.payload, eventType);
    const nowIso = new Date().toISOString();

    const { data: existing, error: findError } = await supabase
      .from("asaas_webhook_events")
      .select("*")
      .eq("tenant_id", input.tenantId)
      .eq("provider", "asaas")
      .eq("provider_event_id", providerEventId)
      .maybeSingle<AsaasWebhookEventRow>();

    if (findError) {
      throw new Error(`Failed to query webhook event: ${findError.message}`);
    }

    let current = existing;

    if (!current) {
      const { data: inserted, error: insertError } = await supabase
        .from("asaas_webhook_events")
        .insert({
          tenant_id: input.tenantId,
          provider: "asaas",
          provider_event_id: providerEventId,
          event_type: eventType,
          raw_payload: input.payload,
          raw_headers: input.rawHeaders,
          signature_validated: input.signatureValidated,
          status: "pending",
          processing_attempts: 0,
          first_received_at: nowIso,
          last_received_at: nowIso,
        })
        .select("*")
        .single<AsaasWebhookEventRow>();

      if (insertError) {
        throw new Error(`Failed to insert webhook event: ${insertError.message}`);
      }

      current = inserted;
    } else {
      const { data: touched, error: touchError } = await supabase
        .from("asaas_webhook_events")
        .update({
          raw_payload: input.payload,
          raw_headers: input.rawHeaders,
          last_received_at: nowIso,
        })
        .eq("id", current.id)
        .select("*")
        .single<AsaasWebhookEventRow>();

      if (touchError) {
        throw new Error(`Failed to update webhook event touch data: ${touchError.message}`);
      }

      current = touched;
    }

    if (current.status === "processed") {
      return {
        accepted: true,
        replayed: true,
        processing: false,
        providerEventId,
        eventType,
        internalState: eventToState(eventType),
      };
    }

    if (current.status === "processing") {
      return {
        accepted: true,
        replayed: true,
        processing: true,
        providerEventId,
        eventType,
        internalState: eventToState(eventType),
      };
    }

    const nextAttempts = (current.processing_attempts ?? 0) + 1;

    const { error: processingError } = await supabase
      .from("asaas_webhook_events")
      .update({
        status: "processing",
        processing_attempts: nextAttempts,
        last_received_at: nowIso,
      })
      .eq("id", current.id);

    if (processingError) {
      throw new Error(`Failed to set event as processing: ${processingError.message}`);
    }

    try {
      const internalState = await this.processBusinessEvent(
        input.tenantId,
        input.payload,
        eventType
      );

      const { error: processedError } = await supabase
        .from("asaas_webhook_events")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", current.id);

      if (processedError) {
        throw new Error(`Failed to mark event as processed: ${processedError.message}`);
      }

      return {
        accepted: true,
        replayed: false,
        processing: false,
        providerEventId,
        eventType,
        internalState,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown webhook processing error";

      await supabase
        .from("asaas_webhook_events")
        .update({
          status: "failed",
          last_error: message,
        })
        .eq("id", current.id);

      throw error;
    }
  }

  public getAccountStatusIdFromPayload(payload: Record<string, unknown>): string | null {
    return getAccountStatusIdFromPayload(payload);
  }
}
