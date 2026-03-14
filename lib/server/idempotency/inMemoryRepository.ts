import { randomUUID } from "crypto";
import type {
  CompleteIdempotencyRecordInput,
  CreateIdempotencyRecordInput,
  FailIdempotencyRecordInput,
  IdempotencyKeyLookup,
  IdempotencyRecord,
} from "./types";
import type { IdempotencyRepository } from "./repository";

const compound = (input: IdempotencyKeyLookup): string =>
  `${input.tenantId}|${input.method.toUpperCase()}|${input.endpoint}|${input.idempotencyKey}`;

export class InMemoryIdempotencyRepository implements IdempotencyRepository {
  private readonly data = new Map<string, IdempotencyRecord>();

  async findByKey(input: IdempotencyKeyLookup): Promise<IdempotencyRecord | null> {
    return this.data.get(compound(input)) ?? null;
  }

  async createStarted(input: CreateIdempotencyRecordInput): Promise<IdempotencyRecord> {
    const now = new Date();
    const key = compound(input);
    const existing = this.data.get(key);

    if (existing) {
      return existing;
    }

    const created: IdempotencyRecord = {
      id: randomUUID(),
      tenantId: input.tenantId,
      method: input.method.toUpperCase(),
      endpoint: input.endpoint,
      idempotencyKey: input.idempotencyKey,
      requestHash: input.requestHash,
      status: "started",
      responseStatusCode: null,
      responseBody: null,
      createdAt: now,
      updatedAt: now,
    };

    this.data.set(key, created);
    return created;
  }

  async markCompleted(input: CompleteIdempotencyRecordInput): Promise<void> {
    for (const [key, record] of this.data.entries()) {
      if (record.id !== input.id) continue;

      this.data.set(key, {
        ...record,
        status: "completed",
        responseStatusCode: input.responseStatusCode,
        responseBody: input.responseBody,
        updatedAt: new Date(),
      });
      return;
    }
  }

  async markFailed(input: FailIdempotencyRecordInput): Promise<void> {
    for (const [key, record] of this.data.entries()) {
      if (record.id !== input.id) continue;

      this.data.set(key, {
        ...record,
        status: "failed",
        responseStatusCode: input.responseStatusCode,
        responseBody: input.responseBody,
        updatedAt: new Date(),
      });
      return;
    }
  }
}
