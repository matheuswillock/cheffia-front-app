import { createHash } from "crypto";

const sortValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const sortedEntries = Object.keys(objectValue)
      .sort()
      .map((key) => [key, sortValue(objectValue[key])] as const);

    return Object.fromEntries(sortedEntries);
  }

  return value;
};

export const hashIdempotencyPayload = (payload: unknown): string => {
  const normalized = sortValue(payload);
  const serialized = JSON.stringify(normalized);
  return createHash("sha256").update(serialized).digest("hex");
};
