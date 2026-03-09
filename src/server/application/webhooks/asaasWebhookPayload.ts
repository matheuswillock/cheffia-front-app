import { hashIdempotencyPayload } from "@/server/shared/idempotency";

export const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const readNestedString = (
  payload: Record<string, unknown>,
  parentKey: string,
  childKey: string
): string | null => {
  const parent = payload[parentKey];
  if (!parent || typeof parent !== "object") return null;
  return readString((parent as Record<string, unknown>)[childKey]);
};

export const getEventType = (payload: Record<string, unknown>): string =>
  readString(payload.event) ??
  readString(payload.type) ??
  readString(payload.name) ??
  "UNKNOWN_EVENT";

export const getProviderEventId = (payload: Record<string, unknown>, eventType: string): string => {
  const direct = readString(payload.id) ?? readString(payload.eventId);
  if (direct) return direct;

  const paymentId = getPaymentIdFromPayload(payload);
  if (paymentId) return `${eventType}:${paymentId}`;

  const accountStatusId = getAccountStatusIdFromPayload(payload);
  if (accountStatusId) return `${eventType}:${accountStatusId}`;

  const data = payload.data;
  if (data && typeof data === "object") {
    const dataId = readString((data as Record<string, unknown>).id);
    if (dataId) return `${eventType}:${dataId}`;
  }

  const fallbackHash = hashIdempotencyPayload(payload);
  return `${eventType}:${fallbackHash}`;
};

export const getPaymentIdFromPayload = (payload: Record<string, unknown>): string | null =>
  readNestedString(payload, "payment", "id") ??
  readNestedString(payload, "data", "id");

export const getAccountStatusIdFromPayload = (payload: Record<string, unknown>): string | null =>
  readNestedString(payload, "accountStatus", "id");
