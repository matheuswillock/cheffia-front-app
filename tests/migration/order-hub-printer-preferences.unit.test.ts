import { describe, expect, test } from "bun:test";
import {
  buildOrderHubPrintEnabledStorageKey,
  parseOrderHubPrintEnabledPreference,
  readOrderHubPrintEnabledPreference,
  resolveOrderHubPrinterGateState,
  writeOrderHubPrintEnabledPreference,
} from "@/app/restaurant/order-hub/[slug]/features/services/order-hub-printer-preferences";

const createStorage = () => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => (store.has(key) ? store.get(key) ?? null : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
};

describe("order hub printer preferences", () => {
  test("builds storage key per restaurant", () => {
    expect(buildOrderHubPrintEnabledStorageKey("rest-123")).toBe(
      "cheffia:orderhub:print-enabled:rest-123"
    );
  });

  test("parses stored boolean with safe fallback", () => {
    expect(parseOrderHubPrintEnabledPreference("true")).toBe(true);
    expect(parseOrderHubPrintEnabledPreference("false")).toBe(false);
    expect(parseOrderHubPrintEnabledPreference("unexpected")).toBeNull();
    expect(parseOrderHubPrintEnabledPreference(null)).toBeNull();
  });

  test("reads default false and persists true/false values", () => {
    const storage = createStorage();

    expect(readOrderHubPrintEnabledPreference("rest-123", storage)).toBe(false);

    writeOrderHubPrintEnabledPreference("rest-123", true, storage);
    expect(readOrderHubPrintEnabledPreference("rest-123", storage)).toBe(true);

    writeOrderHubPrintEnabledPreference("rest-123", false, storage);
    expect(readOrderHubPrintEnabledPreference("rest-123", storage)).toBe(false);
  });

  test("resolves gate state for online and offline agents", () => {
    expect(resolveOrderHubPrinterGateState(true)).toEqual({
      canStartRealtime: true,
      shouldPromptOperator: false,
    });

    expect(resolveOrderHubPrinterGateState(false)).toEqual({
      canStartRealtime: false,
      shouldPromptOperator: true,
    });
  });
});
