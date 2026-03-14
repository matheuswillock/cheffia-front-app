import { getAsaasConfig } from "./config";
import { AsaasApiError, AsaasNetworkError } from "./errors";
import type {
  AsaasChargePayload,
  AsaasChargeResponse,
  AsaasClientConfig,
  AsaasCustomerPayload,
  AsaasCustomerResponse,
  AsaasDocumentUploadPayload,
  AsaasDocumentUploadResponse,
  AsaasErrorResponse,
  AsaasMyAccountDocumentsResponse,
  AsaasMyAccountStatusResponse,
  AsaasPaymentResponse,
  AsaasRequestContext,
  AsaasRequestOptions,
  AsaasSubaccountPayload,
  AsaasSubaccountResponse,
  AsaasSubscriptionPayload,
  AsaasSubscriptionResponse,
} from "./types";

const safeWait = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const toQueryString = (
  query: Record<string, string | number | boolean | null | undefined> | undefined
): string => {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) continue;
    params.append(key, String(value));
  }

  const stringified = params.toString();
  return stringified ? `?${stringified}` : "";
};

const shouldRetryByStatus = (status: number): boolean => status >= 500 || status === 429;

const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(objectValue)) {
      const lower = key.toLowerCase();
      const sensitive = ["apikey", "token", "authorization", "card", "cvv", "password", "secret"];

      if (sensitive.some((s) => lower.includes(s))) {
        out[key] = "***";
      } else {
        out[key] = redact(item);
      }
    }

    return out;
  }

  return value;
};

const logAsaas = (level: "info" | "error", message: string, data: Record<string, unknown>): void => {
  const payload = redact(data);
  if (level === "error") {
    console.error("asaas.client", message, payload);
    return;
  }
  console.info("asaas.client", message, payload);
};

export class AsaasClient {
  private readonly config: AsaasClientConfig;
  private readonly fetchImpl: typeof fetch;

  constructor(config?: Partial<AsaasClientConfig>, fetchImpl: typeof fetch = fetch) {
    const base = getAsaasConfig();
    this.config = {
      ...base,
      ...config,
    };
    this.fetchImpl = fetchImpl;
  }

  private async performRequest<T>(options: AsaasRequestOptions): Promise<T> {
    const path = options.path.startsWith("/") ? options.path : `/${options.path}`;
    const url = `${this.config.baseUrl}${path}${toQueryString(options.query)}`;
    const method = options.method.toUpperCase();
    const maxAttempts = Math.max(0, this.config.maxRetries) + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const headers: Record<string, string> = {
          accept: "application/json",
          access_token: this.config.apiKey,
          ...(options.headers ?? {}),
        };
        const hasContentType = Object.keys(headers).some(
          (key) => key.toLowerCase() === "content-type"
        );
        const isFormData =
          typeof FormData !== "undefined" && options.body instanceof FormData;
        const requestBody =
          options.body === undefined
            ? undefined
            : isFormData
            ? (options.body as BodyInit)
            : JSON.stringify(options.body);

        if (options.body !== undefined && !isFormData && !hasContentType) {
          headers["Content-Type"] = "application/json";
        }

        const response = await this.fetchImpl(url, {
          method,
          headers,
          body: requestBody,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          if (response.status === 204) return {} as T;
          return (await response.json()) as T;
        }

        const details = (await response.json().catch(() => null)) as AsaasErrorResponse | null;
        const firstError = details?.errors?.[0];
        const message = firstError?.description ?? `Asaas request failed with status ${response.status}`;
        const retryable = shouldRetryByStatus(response.status);

        logAsaas("error", "request_failed", {
          method,
          path,
          status: response.status,
          attempt,
          requestId: options.context?.requestId ?? null,
          tenantId: options.context?.tenantId ?? null,
          errorCode: firstError?.code ?? null,
          errorMessage: firstError?.description ?? null,
        });

        if (retryable && attempt < maxAttempts) {
          const delayMs = this.config.retryBaseDelayMs * Math.pow(2, attempt - 1);
          await safeWait(delayMs);
          continue;
        }

        throw new AsaasApiError(message, {
          status: response.status,
          details,
          retryable,
        });
      } catch (error) {
        clearTimeout(timeout);

        if (error instanceof AsaasApiError) {
          throw error;
        }

        const retryable = attempt < maxAttempts;
        const message =
          error instanceof Error ? error.message : "Unknown network error while calling Asaas";

        logAsaas("error", "network_or_timeout_error", {
          method,
          path,
          attempt,
          retryable,
          requestId: options.context?.requestId ?? null,
          tenantId: options.context?.tenantId ?? null,
          message,
        });

        if (retryable) {
          const delayMs = this.config.retryBaseDelayMs * Math.pow(2, attempt - 1);
          await safeWait(delayMs);
          continue;
        }

        throw new AsaasNetworkError(message);
      }
    }

    throw new AsaasNetworkError("Retry exhaustion while calling Asaas");
  }

  public async createCustomer(
    payload: AsaasCustomerPayload,
    context?: AsaasRequestContext
  ): Promise<AsaasCustomerResponse> {
    logAsaas("info", "create_customer", {
      requestId: context?.requestId ?? null,
      tenantId: context?.tenantId ?? null,
    });

    return this.performRequest<AsaasCustomerResponse>({
      method: "POST",
      path: "/customers",
      body: payload,
      context,
    });
  }

  public async createSubaccount(
    payload: AsaasSubaccountPayload,
    context?: AsaasRequestContext
  ): Promise<AsaasSubaccountResponse> {
    logAsaas("info", "create_subaccount", {
      requestId: context?.requestId ?? null,
      tenantId: context?.tenantId ?? null,
      hasWebhooks: Boolean(payload.webhooks?.length),
    });

    return this.performRequest<AsaasSubaccountResponse>({
      method: "POST",
      path: "/accounts",
      body: payload,
      context,
    });
  }

  public async createCharge(
    payload: AsaasChargePayload,
    context?: AsaasRequestContext
  ): Promise<AsaasChargeResponse> {
    logAsaas("info", "create_charge", {
      requestId: context?.requestId ?? null,
      tenantId: context?.tenantId ?? null,
      billingType: payload.billingType,
      value: payload.value,
    });

    return this.performRequest<AsaasChargeResponse>({
      method: "POST",
      path: "/payments",
      body: payload,
      context,
    });
  }

  public async createSubscription(
    payload: AsaasSubscriptionPayload,
    context?: AsaasRequestContext
  ): Promise<AsaasSubscriptionResponse> {
    logAsaas("info", "create_subscription", {
      requestId: context?.requestId ?? null,
      tenantId: context?.tenantId ?? null,
      cycle: payload.cycle,
      value: payload.value,
    });

    return this.performRequest<AsaasSubscriptionResponse>({
      method: "POST",
      path: "/subscriptions",
      body: payload,
      context,
    });
  }

  public async getPayment(
    paymentId: string,
    context?: AsaasRequestContext
  ): Promise<AsaasPaymentResponse> {
    logAsaas("info", "get_payment", {
      requestId: context?.requestId ?? null,
      tenantId: context?.tenantId ?? null,
      paymentId,
    });

    return this.performRequest<AsaasPaymentResponse>({
      method: "GET",
      path: `/payments/${paymentId}`,
      context,
    });
  }

  public async getMyAccountDocuments(
    context?: AsaasRequestContext
  ): Promise<AsaasMyAccountDocumentsResponse> {
    logAsaas("info", "get_my_account_documents", {
      requestId: context?.requestId ?? null,
      tenantId: context?.tenantId ?? null,
    });

    return this.performRequest<AsaasMyAccountDocumentsResponse>({
      method: "GET",
      path: "/myAccount/documents",
      context,
    });
  }

  public async getMyAccountStatus(
    context?: AsaasRequestContext
  ): Promise<AsaasMyAccountStatusResponse> {
    logAsaas("info", "get_my_account_status", {
      requestId: context?.requestId ?? null,
      tenantId: context?.tenantId ?? null,
    });

    return this.performRequest<AsaasMyAccountStatusResponse>({
      method: "GET",
      path: "/myAccount/status",
      context,
    });
  }

  public async uploadMyAccountDocument(
    documentGroupId: string,
    payload: AsaasDocumentUploadPayload,
    context?: AsaasRequestContext
  ): Promise<AsaasDocumentUploadResponse> {
    logAsaas("info", "upload_my_account_document", {
      requestId: context?.requestId ?? null,
      tenantId: context?.tenantId ?? null,
      documentGroupId,
      type: payload.type,
      contentType: payload.contentType,
      size: payload.data.byteLength,
    });

    const formData = new FormData();
    const blob = new Blob([payload.data], { type: payload.contentType });
    formData.append("documentFile", blob, payload.fileName);
    formData.append("type", payload.type);

    return this.performRequest<AsaasDocumentUploadResponse>({
      method: "POST",
      path: `/myAccount/documents/${documentGroupId}`,
      body: formData,
      context,
    });
  }
}
