import type { AsaasErrorResponse } from "./types";

export class AsaasApiError extends Error {
  public readonly status: number;
  public readonly details: AsaasErrorResponse | null;
  public readonly retryable: boolean;

  constructor(
    message: string,
    options: { status: number; details: AsaasErrorResponse | null; retryable: boolean }
  ) {
    super(message);
    this.name = "AsaasApiError";
    this.status = options.status;
    this.details = options.details;
    this.retryable = options.retryable;
  }
}

export class AsaasNetworkError extends Error {
  public readonly retryable = true;

  constructor(message: string) {
    super(message);
    this.name = "AsaasNetworkError";
  }
}
