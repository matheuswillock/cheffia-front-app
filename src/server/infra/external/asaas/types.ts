export interface AsaasClientConfig {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
}

export interface AsaasRequestContext {
  requestId?: string;
  tenantId?: string;
}

export interface AsaasRequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  context?: AsaasRequestContext;
}

export interface AsaasErrorPayload {
  code?: string;
  description?: string;
}

export interface AsaasErrorResponse {
  errors?: AsaasErrorPayload[];
}

export interface AsaasCustomerPayload {
  name: string;
  email?: string;
  cpfCnpj?: string;
  mobilePhone?: string;
}

export interface AsaasCustomerResponse {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
  mobilePhone?: string;
}

export interface AsaasChargePayload {
  customer: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}

export interface AsaasChargeResponse {
  id: string;
  customer: string;
  value: number;
  billingType: string;
  status: string;
  dueDate: string;
}

export interface AsaasSubscriptionPayload {
  customer: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX";
  value: number;
  nextDueDate: string;
  cycle: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
  description?: string;
  externalReference?: string;
}

export interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  value: number;
  cycle: string;
  status: string;
  nextDueDate: string;
}

export interface AsaasPaymentResponse {
  id: string;
  customer: string;
  value: number;
  billingType: string;
  status: string;
  dueDate: string;
}
