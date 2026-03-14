import { failOutput } from "../output";
import { IdempotencyConflictError, IdempotencyInProgressError } from "./errors";
import { hashIdempotencyPayload } from "./hash";
import type { IdempotencyRepository } from "./repository";
import type { IdempotencyKeyLookup } from "./types";
import type { Output } from "../output";

export interface ExecuteWithIdempotencyParams<T> extends IdempotencyKeyLookup {
  payloadForHash?: unknown;
  repository: IdempotencyRepository;
  execute: () => Promise<{ output: Output<T>; statusCode?: number }>;
}

export interface ExecuteWithIdempotencyResult<T> {
  output: Output<T>;
  statusCode: number;
  replayed: boolean;
  recordId: string;
}

const sanitizeKeyPart = (value: string): string => value.trim();

const assertIdempotencyInput = (input: IdempotencyKeyLookup): void => {
  if (!sanitizeKeyPart(input.tenantId)) {
    throw new Error("tenantId is required for idempotency");
  }
  if (!sanitizeKeyPart(input.endpoint)) {
    throw new Error("endpoint is required for idempotency");
  }
  if (!sanitizeKeyPart(input.method)) {
    throw new Error("method is required for idempotency");
  }
  if (!sanitizeKeyPart(input.idempotencyKey)) {
    throw new Error("idempotencyKey is required");
  }
};

export const executeWithIdempotency = async <T>(
  params: ExecuteWithIdempotencyParams<T>
): Promise<ExecuteWithIdempotencyResult<T>> => {
  const lookup = {
    tenantId: sanitizeKeyPart(params.tenantId),
    method: sanitizeKeyPart(params.method).toUpperCase(),
    endpoint: sanitizeKeyPart(params.endpoint),
    idempotencyKey: sanitizeKeyPart(params.idempotencyKey),
  };

  assertIdempotencyInput(lookup);

  const requestHash = params.payloadForHash
    ? hashIdempotencyPayload(params.payloadForHash)
    : null;

  const existing = await params.repository.findByKey(lookup);

  if (existing) {
    if (existing.requestHash && requestHash && existing.requestHash !== requestHash) {
      throw new IdempotencyConflictError(
        "The same idempotency key was reused with a different payload."
      );
    }

    if (existing.status === "started") {
      throw new IdempotencyInProgressError(
        "Another request with the same idempotency key is already in progress."
      );
    }

    if (existing.responseBody) {
      return {
        output: existing.responseBody as Output<T>,
        statusCode: existing.responseStatusCode ?? 200,
        replayed: true,
        recordId: existing.id,
      };
    }
  }

  const created = await params.repository.createStarted({
    ...lookup,
    requestHash,
  });

  if (created.status === "completed" || created.status === "failed") {
    const replayOutput = (created.responseBody ??
      failOutput<T>("Idempotency replay failed: missing persisted response")) as Output<T>;

    return {
      output: replayOutput,
      statusCode: created.responseStatusCode ?? (created.status === "completed" ? 200 : 400),
      replayed: true,
      recordId: created.id,
    };
  }

  const execution = await params.execute();
  const statusCode = execution.statusCode ?? (execution.output.isValid ? 200 : 400);

  if (execution.output.isValid) {
    await params.repository.markCompleted({
      id: created.id,
      responseStatusCode: statusCode,
      responseBody: execution.output as Output<unknown>,
    });
  } else {
    await params.repository.markFailed({
      id: created.id,
      responseStatusCode: statusCode,
      responseBody: execution.output as Output<unknown>,
    });
  }

  return {
    output: execution.output,
    statusCode,
    replayed: false,
    recordId: created.id,
  };
};
