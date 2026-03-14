import type { Output } from "../output";

export type IdempotencyStatus = "started" | "completed" | "failed";

export interface IdempotencyKeyLookup {
  tenantId: string;
  method: string;
  endpoint: string;
  idempotencyKey: string;
}

export interface IdempotencyRecord {
  id: string;
  tenantId: string;
  method: string;
  endpoint: string;
  idempotencyKey: string;
  requestHash: string | null;
  status: IdempotencyStatus;
  responseStatusCode: number | null;
  responseBody: Output<unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdempotencyRecordInput extends IdempotencyKeyLookup {
  requestHash: string | null;
}

export interface CompleteIdempotencyRecordInput {
  id: string;
  responseStatusCode: number;
  responseBody: Output<unknown>;
}

export interface FailIdempotencyRecordInput {
  id: string;
  responseStatusCode: number;
  responseBody: Output<unknown>;
}
