import { randomUUID } from "crypto";

const safeTrim = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const resolveRequestIdFromHeaders = (headers: Headers): string => {
  const requestId =
    safeTrim(headers.get("x-request-id")) ??
    safeTrim(headers.get("x-correlation-id"));

  return requestId ?? randomUUID();
};

export const resolveRequestIdFromRequest = (request: Request): string =>
  resolveRequestIdFromHeaders(request.headers);
