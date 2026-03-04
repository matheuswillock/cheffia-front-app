import type {
  CompleteIdempotencyRecordInput,
  CreateIdempotencyRecordInput,
  FailIdempotencyRecordInput,
  IdempotencyKeyLookup,
  IdempotencyRecord,
} from "./types";

export interface IdempotencyRepository {
  findByKey(input: IdempotencyKeyLookup): Promise<IdempotencyRecord | null>;
  createStarted(input: CreateIdempotencyRecordInput): Promise<IdempotencyRecord>;
  markCompleted(input: CompleteIdempotencyRecordInput): Promise<void>;
  markFailed(input: FailIdempotencyRecordInput): Promise<void>;
}
