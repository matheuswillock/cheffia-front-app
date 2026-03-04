export class IdempotencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}

export class IdempotencyInProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdempotencyInProgressError";
  }
}
