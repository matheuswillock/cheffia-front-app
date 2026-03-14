export const ORDER_HUB_PRINT_ENABLED_STORAGE_KEY_PREFIX = "cheffia:orderhub:print-enabled";

interface SessionStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

interface PrinterGateState {
  canStartRealtime: boolean;
  shouldPromptOperator: boolean;
}

const toSafeRestaurantId = (restaurantId: string): string => {
  const trimmed = restaurantId.trim();
  return trimmed.length ? trimmed : "unknown";
};

const resolveSessionStorage = (storage?: SessionStorageLike): SessionStorageLike | null => {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
};

export const buildOrderHubPrintEnabledStorageKey = (restaurantId: string): string =>
  `${ORDER_HUB_PRINT_ENABLED_STORAGE_KEY_PREFIX}:${toSafeRestaurantId(restaurantId)}`;

export const parseOrderHubPrintEnabledPreference = (value: string | null): boolean | null => {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

export const readOrderHubPrintEnabledPreference = (
  restaurantId: string,
  storage?: SessionStorageLike
): boolean => {
  const sessionStorage = resolveSessionStorage(storage);
  if (!sessionStorage) return false;

  try {
    const key = buildOrderHubPrintEnabledStorageKey(restaurantId);
    const parsed = parseOrderHubPrintEnabledPreference(sessionStorage.getItem(key));
    return parsed ?? false;
  } catch {
    return false;
  }
};

export const writeOrderHubPrintEnabledPreference = (
  restaurantId: string,
  enabled: boolean,
  storage?: SessionStorageLike
): void => {
  const sessionStorage = resolveSessionStorage(storage);
  if (!sessionStorage) return;

  try {
    const key = buildOrderHubPrintEnabledStorageKey(restaurantId);
    sessionStorage.setItem(key, enabled ? "true" : "false");
  } catch {
    // Ignore storage write errors to keep runtime flow stable
  }
};

export const resolveOrderHubPrinterGateState = (isPrinterAgentOnline: boolean): PrinterGateState =>
  isPrinterAgentOnline
    ? {
        canStartRealtime: true,
        shouldPromptOperator: false,
      }
    : {
        canStartRealtime: false,
        shouldPromptOperator: true,
      };
