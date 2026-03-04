import { getSupabaseAdminClient } from "@/server/infra/supabase/adminClient";
import type { IdempotencyRepository } from "@/server/shared/idempotency/repository";
import type {
  CompleteIdempotencyRecordInput,
  CreateIdempotencyRecordInput,
  FailIdempotencyRecordInput,
  IdempotencyKeyLookup,
  IdempotencyRecord,
} from "@/server/shared/idempotency/types";

interface IdempotencyRow {
  id: string;
  tenant_id: string;
  method: string;
  endpoint: string;
  idempotency_key: string;
  request_hash: string | null;
  status: "started" | "completed" | "failed";
  response_status_code: number | null;
  response_body: unknown;
  created_at: string;
  updated_at: string;
}

const mapRow = (row: IdempotencyRow): IdempotencyRecord => ({
  id: row.id,
  tenantId: row.tenant_id,
  method: row.method,
  endpoint: row.endpoint,
  idempotencyKey: row.idempotency_key,
  requestHash: row.request_hash,
  status: row.status,
  responseStatusCode: row.response_status_code,
  responseBody: (row.response_body as IdempotencyRecord["responseBody"]) ?? null,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export class SupabaseIdempotencyRepository implements IdempotencyRepository {
  public async findByKey(input: IdempotencyKeyLookup): Promise<IdempotencyRecord | null> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("idempotency_keys")
      .select("*")
      .eq("tenant_id", input.tenantId)
      .eq("method", input.method.toUpperCase())
      .eq("endpoint", input.endpoint)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle<IdempotencyRow>();

    if (error) {
      throw new Error(`Idempotency findByKey failed: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  public async createStarted(input: CreateIdempotencyRecordInput): Promise<IdempotencyRecord> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("idempotency_keys")
      .insert({
        tenant_id: input.tenantId,
        method: input.method.toUpperCase(),
        endpoint: input.endpoint,
        idempotency_key: input.idempotencyKey,
        request_hash: input.requestHash,
        status: "started",
      })
      .select("*")
      .single<IdempotencyRow>();

    if (!error) {
      return mapRow(data);
    }

    if (error.code === "23505") {
      const already = await this.findByKey(input);
      if (already) return already;
    }

    throw new Error(`Idempotency createStarted failed: ${error.message}`);
  }

  public async markCompleted(input: CompleteIdempotencyRecordInput): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("idempotency_keys")
      .update({
        status: "completed",
        response_status_code: input.responseStatusCode,
        response_body: input.responseBody,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(`Idempotency markCompleted failed: ${error.message}`);
    }
  }

  public async markFailed(input: FailIdempotencyRecordInput): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("idempotency_keys")
      .update({
        status: "failed",
        response_status_code: input.responseStatusCode,
        response_body: input.responseBody,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(`Idempotency markFailed failed: ${error.message}`);
    }
  }
}
