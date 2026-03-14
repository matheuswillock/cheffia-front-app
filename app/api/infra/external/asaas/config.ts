import type { AsaasClientConfig } from "./types";

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getAsaasConfig = (): AsaasClientConfig => {
  const apiKey = process.env.ASAAS_API_KEY ?? "";

  if (!apiKey.trim()) {
    throw new Error("Missing ASAAS_API_KEY environment variable.");
  }

  return {
    apiKey,
    baseUrl: (process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3").replace(/\/+$/, ""),
    timeoutMs: toNumber(process.env.ASAAS_TIMEOUT_MS, 10_000),
    maxRetries: toNumber(process.env.ASAAS_MAX_RETRIES, 2),
    retryBaseDelayMs: toNumber(process.env.ASAAS_RETRY_BASE_DELAY_MS, 250),
  };
};
