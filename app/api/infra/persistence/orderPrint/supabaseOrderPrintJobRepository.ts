import { getSupabaseAdminClient } from "@/app/api/infra/supabase/adminClient";
import type { OrderPrintTicketPayload } from "@/lib/printing/contracts";
import type { OrderPrintJobStatus } from "@/lib/printing/jobContracts";
import type { OrderPrintJobRecord } from "./types";

interface OrderPrintJobRow {
  id: string;
  tenant_id: string;
  outbox_event_id: string;
  restaurant_id: string;
  printer_id: string;
  status: OrderPrintJobStatus;
  attempt_count: number;
  last_error: string | null;
  payload_snapshot: unknown;
  claimed_at: string | null;
  printed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateOrderPrintJobInput {
  tenantId: string;
  eventId: string;
  restaurantId: string;
  printerId: string;
  payloadSnapshot: OrderPrintTicketPayload;
}

interface TouchOrderPrintJobInput {
  tenantId: string;
  jobId: string;
  payloadSnapshot: OrderPrintTicketPayload;
}

const mapRow = (row: OrderPrintJobRow): OrderPrintJobRecord => ({
  id: row.id,
  tenantId: row.tenant_id,
  eventId: row.outbox_event_id,
  restaurantId: row.restaurant_id,
  printerId: row.printer_id,
  status: row.status,
  attemptCount: row.attempt_count,
  lastError: row.last_error,
  payloadSnapshot: row.payload_snapshot,
  claimedAt: row.claimed_at,
  printedAt: row.printed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class SupabaseOrderPrintJobRepository {
  public async findByEventAndPrinter(
    tenantId: string,
    eventId: string,
    printerId: string
  ): Promise<OrderPrintJobRecord | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("order_print_jobs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("outbox_event_id", eventId)
      .eq("printer_id", printerId)
      .maybeSingle<OrderPrintJobRow>();

    if (error) {
      throw new Error(`Order print job findByEventAndPrinter failed: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  public async findById(tenantId: string, jobId: string): Promise<OrderPrintJobRecord | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("order_print_jobs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", jobId)
      .maybeSingle<OrderPrintJobRow>();

    if (error) {
      throw new Error(`Order print job findById failed: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  public async createClaimed(input: CreateOrderPrintJobInput): Promise<OrderPrintJobRecord> {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("order_print_jobs")
      .insert({
        tenant_id: input.tenantId,
        outbox_event_id: input.eventId,
        restaurant_id: input.restaurantId,
        printer_id: input.printerId,
        status: "claimed",
        attempt_count: 0,
        last_error: null,
        payload_snapshot: input.payloadSnapshot,
        claimed_at: now,
      })
      .select("*")
      .single<OrderPrintJobRow>();

    if (!error) {
      return mapRow(data);
    }

    if (error.code === "23505") {
      const existing = await this.findByEventAndPrinter(input.tenantId, input.eventId, input.printerId);
      if (existing) return existing;
    }

    throw new Error(`Order print job createClaimed failed: ${error.message}`);
  }

  public async touchClaimed(input: TouchOrderPrintJobInput): Promise<OrderPrintJobRecord> {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("order_print_jobs")
      .update({
        status: "claimed",
        last_error: null,
        payload_snapshot: input.payloadSnapshot,
        claimed_at: now,
      })
      .eq("tenant_id", input.tenantId)
      .eq("id", input.jobId)
      .select("*")
      .single<OrderPrintJobRow>();

    if (error) {
      throw new Error(`Order print job touchClaimed failed: ${error.message}`);
    }

    return mapRow(data);
  }

  public async markPrinted(tenantId: string, jobId: string): Promise<OrderPrintJobRecord> {
    return this.markStatus(tenantId, jobId, "printed", null);
  }

  public async markFailed(
    tenantId: string,
    jobId: string,
    errorMessage: string
  ): Promise<OrderPrintJobRecord> {
    return this.markStatus(tenantId, jobId, "failed", errorMessage);
  }

  private async markStatus(
    tenantId: string,
    jobId: string,
    status: Extract<OrderPrintJobStatus, "printed" | "failed">,
    errorMessage: string | null
  ): Promise<OrderPrintJobRecord> {
    const current = await this.findById(tenantId, jobId);
    if (!current) {
      throw new Error("Order print job not found");
    }

    const nextAttemptCount = current.attemptCount + 1;
    const supabase = getSupabaseAdminClient();

    const payload: Record<string, unknown> = {
      status,
      attempt_count: nextAttemptCount,
      last_error: errorMessage,
    };

    if (status === "printed") {
      payload.printed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("order_print_jobs")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", jobId)
      .select("*")
      .single<OrderPrintJobRow>();

    if (error) {
      throw new Error(`Order print job markStatus failed: ${error.message}`);
    }

    return mapRow(data);
  }
}
