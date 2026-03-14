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
  headers?: Record<string, string>;
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

export interface AsaasWebhookConfigPayload {
  name?: string;
  url: string;
  email?: string;
  sendType?: "SEQUENTIALLY" | "NON_SEQUENTIALLY";
  interrupted?: boolean;
  enabled?: boolean;
  apiVersion?: number;
  authToken?: string;
  events: string[];
}

export interface AsaasSubaccountPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  birthDate?: string;
  companyType?: string;
  phone?: string;
  mobilePhone?: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  postalCode: string;
  webhooks?: AsaasWebhookConfigPayload[];
}

export interface AsaasSubaccountResponse {
  id: string;
  name: string;
  email: string;
  walletId?: string;
  apiKey?: string;
}

export interface AsaasMyAccountDocumentFileSummary {
  id?: string;
  status?: string;
}

export interface AsaasMyAccountDocumentGroupResponse {
  id: string;
  status: string;
  type: string;
  title: string;
  description?: string | null;
  onboardingUrl?: string | null;
  responsible?: {
    name?: string | null;
    type?: string | null;
  } | null;
  documents?: AsaasMyAccountDocumentFileSummary[];
}

export interface AsaasMyAccountDocumentsResponse {
  rejectReasons?: unknown;
  data: AsaasMyAccountDocumentGroupResponse[];
}

export interface AsaasMyAccountStatusResponse {
  id: string;
  commercialInfo: string;
  bankAccountInfo: string;
  documentation: string;
  general: string;
  commercialInfoExpiration?: {
    isExpired?: boolean;
    scheduledDate?: string | null;
  } | null;
}

export interface AsaasDocumentUploadPayload {
  type: string;
  fileName: string;
  contentType: string;
  data: Uint8Array;
}

export interface AsaasDocumentUploadResponse {
  id?: string;
  status?: string;
  [key: string]: unknown;
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
