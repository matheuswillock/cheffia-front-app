export type TenantContextErrorCode =
  | "TENANT_CONTEXT_MISSING"
  | "TENANT_CONTEXT_CONFLICT"
  | "TENANT_CONTEXT_INVALID";

export class TenantContextError extends Error {
  public readonly code: TenantContextErrorCode;

  constructor(code: TenantContextErrorCode, message: string) {
    super(message);
    this.name = "TenantContextError";
    this.code = code;
  }
}
