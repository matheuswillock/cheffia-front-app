import { RestaurantFinancialOnboardingDocumentService } from "./restaurantFinancialOnboardingDocumentService";

interface ScheduleInitialSyncInput {
  tenantId: string;
  restaurantId: string;
}

interface ScheduleInitialSyncResult {
  scheduled: boolean;
  reason: "scheduled" | "disabled" | "already_scheduled";
  delayMs: number | null;
}

const DEFAULT_INITIAL_SYNC_DELAY_MS = 15_000;
const scheduledInitialSyncs = new Map<string, ReturnType<typeof setTimeout>>();

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
};

const isInitialSyncEnabled = (): boolean =>
  parseBoolean(process.env.ASAAS_INITIAL_DOCUMENT_SYNC_ENABLED, true);

const getInitialSyncDelayMs = (): number => {
  const raw = process.env.ASAAS_INITIAL_DOCUMENT_SYNC_DELAY_MS?.trim() ?? "";
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_INITIAL_SYNC_DELAY_MS;
  }

  return Math.floor(parsed);
};

const runInitialSync = async ({ tenantId, restaurantId }: ScheduleInitialSyncInput): Promise<void> => {
  try {
    const service = new RestaurantFinancialOnboardingDocumentService();
    const synced = await service.syncDocuments(tenantId, restaurantId);

    if (!synced.isValid) {
      console.error("asaas.initial_document_sync.failed", {
        tenantId,
        restaurantId,
        errors: synced.errorMessages,
      });
      return;
    }

    console.warn("asaas.initial_document_sync.completed", {
      tenantId,
      restaurantId,
      documents: synced.result?.length ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("asaas.initial_document_sync.failed", {
      tenantId,
      restaurantId,
      message,
    });
  }
};

export const scheduleInitialRestaurantFinancialSync = (
  input: ScheduleInitialSyncInput
): ScheduleInitialSyncResult => {
  if (!isInitialSyncEnabled()) {
    return {
      scheduled: false,
      reason: "disabled",
      delayMs: null,
    };
  }

  const key = `${input.tenantId}:${input.restaurantId}`;
  if (scheduledInitialSyncs.has(key)) {
    return {
      scheduled: false,
      reason: "already_scheduled",
      delayMs: getInitialSyncDelayMs(),
    };
  }

  const delayMs = getInitialSyncDelayMs();
  const timer = setTimeout(() => {
    scheduledInitialSyncs.delete(key);
    void runInitialSync(input);
  }, delayMs);

  if (typeof timer === "object" && timer !== null && "unref" in timer && typeof timer.unref === "function") {
    timer.unref();
  }
  scheduledInitialSyncs.set(key, timer);

  return {
    scheduled: true,
    reason: "scheduled",
    delayMs,
  };
};

