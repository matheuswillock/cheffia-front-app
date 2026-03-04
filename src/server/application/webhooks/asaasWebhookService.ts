import { hashIdempotencyPayload } from "@/server/shared/idempotency";
import { getSupabaseAdminClient } from "@/server/infra/supabase/adminClient";

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

const eventToState = (eventType: string): string => {
  const normalized = eventType.toUpperCase();

  if (normalized.includes("CONFIRMED")) return "payment_confirmed";
  if (normalized.includes("RECEIVED")) return "payment_received";
  if (normalized.includes("OVERDUE")) return "payment_overdue";
  if (normalized.includes("REFUNDED")) return "payment_refunded";
  if (normalized.includes("DELETED")) return "payment_deleted";

  return "event_received";
};

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const getEventType = (payload: Record<string, unknown>): string =>
  readString(payload.event) ??
  readString(payload.type) ??
  readString(payload.name) ??
  "UNKNOWN_EVENT";

const getProviderEventId = (payload: Record<string, unknown>, eventType: string): string => {
  const direct = readString(payload.id) ?? readString(payload.eventId);
  if (direct) return direct;

  const payment = payload.payment;
  if (payment && typeof payment === "object") {
    const paymentId = readString((payment as Record<string, unknown>).id);
    if (paymentId) return `${eventType}:${paymentId}`;
  }

  const data = payload.data;
  if (data && typeof data === "object") {
    const dataId = readString((data as Record<string, unknown>).id);
    if (dataId) return `${eventType}:${dataId}`;
  }

  const fallbackHash = hashIdempotencyPayload(payload);
  return `${eventType}:${fallbackHash}`;
};

export class AsaasWebhookService {
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
      const internalState = eventToState(eventType);

      // Placeholder: dominio ainda sera conectado aos use cases de billing.
      // Aqui garantimos idempotencia de ingestao + deduplicacao + estado do evento.

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
}
