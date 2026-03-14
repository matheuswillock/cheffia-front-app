"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { ClaimOrderPrintJobOutput } from "@/lib/printing/jobContracts";
import type { OrderHubEventView, OrderPrintUiState, OrderPrintUiStatus } from "@/components/OrderHubContent/types";
import {
  checkLocalPrintAgentHealth,
  claimOrderPrintJobRequest,
  completeOrderPrintJobRequest,
  reprintOrderPrintJobRequest,
  sendTicketToLocalPrintAgent,
} from "@/app/restaurant/order-hub/[slug]/features/services/OrderHubPrintService";
import { collectAutoPrintableRealtimeOrderSentEventIds } from "@/app/restaurant/order-hub/[slug]/features/services/order-hub-print-automation";

interface UseOrderHubPrintAutomationParams {
  restaurantId: string;
  events: OrderHubEventView[];
  printingEnabled: boolean;
}

interface QueueItem {
  eventId: string;
  mode: "auto" | "manual";
  retry: number;
}

interface UseOrderHubPrintAutomationResult {
  printStatesByEventId: Record<string, OrderPrintUiState>;
  pendingJobsCount: number;
  localAgentOnline: boolean;
  manualReprint: (eventId: string) => void;
}

const DEFAULT_PRINTER_ID =
  process.env.NEXT_PUBLIC_ORDER_PRINT_PRINTER_ID?.trim() || "kitchen-default";
const MAX_AUTO_RETRIES = 3;
const RETRY_DELAYS_MS = [2000, 5000, 10000];

const nowIso = (): string => new Date().toISOString();

const nextUiState = (
  previous: OrderPrintUiState | undefined,
  status: OrderPrintUiStatus,
  patch: Partial<OrderPrintUiState> = {}
): OrderPrintUiState => ({
  status,
  attempts: previous?.attempts ?? 0,
  lastError: previous?.lastError ?? null,
  jobId: previous?.jobId ?? null,
  updatedAt: nowIso(),
  ...patch,
});

export const useOrderHubPrintAutomation = ({
  restaurantId,
  events,
  printingEnabled,
}: UseOrderHubPrintAutomationParams): UseOrderHubPrintAutomationResult => {
  const [printStatesByEventId, setPrintStatesByEventId] = useState<Record<string, OrderPrintUiState>>({});
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeItem, setActiveItem] = useState<QueueItem | null>(null);
  const [localAgentOnline, setLocalAgentOnline] = useState(false);

  const seenRealtimeEventIdsRef = useRef<Set<string>>(new Set());
  const retryTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const eventsById = useMemo(() => {
    return new Map(events.map((event) => [event.id, event]));
  }, [events]);

  const updatePrintState = useCallback(
    (eventId: string, status: OrderPrintUiStatus, patch: Partial<OrderPrintUiState> = {}) => {
      setPrintStatesByEventId((current) => ({
        ...current,
        [eventId]: nextUiState(current[eventId], status, patch),
      }));
    },
    []
  );

  const clearRetryTimer = useCallback((eventId: string) => {
    const timer = retryTimersRef.current.get(eventId);
    if (timer) {
      clearTimeout(timer);
      retryTimersRef.current.delete(eventId);
    }
  }, []);

  const enqueue = useCallback(
    (eventId: string, mode: QueueItem["mode"], retry: number) => {
      setQueue((current) => {
        if (current.some((item) => item.eventId === eventId && item.mode === mode)) {
          return current;
        }

        if (activeItem && activeItem.eventId === eventId && activeItem.mode === mode) {
          return current;
        }

        return [...current, { eventId, mode, retry }];
      });

      updatePrintState(eventId, "queued");
    },
    [activeItem, updatePrintState]
  );

  const scheduleRetry = useCallback(
    (eventId: string, retry: number): boolean => {
      if (retry > MAX_AUTO_RETRIES) return false;

      clearRetryTimer(eventId);
      const delay = RETRY_DELAYS_MS[Math.min(retry - 1, RETRY_DELAYS_MS.length - 1)] ?? 15000;

      const timer = setTimeout(() => {
        enqueue(eventId, "auto", retry);
      }, delay);

      retryTimersRef.current.set(eventId, timer);
      return true;
    },
    [clearRetryTimer, enqueue]
  );

  const processQueueItem = useCallback(
    async (item: QueueItem): Promise<void> => {
      if (!printingEnabled) return;

      const event = eventsById.get(item.eventId);
      if (!event || !restaurantId) return;
      if (event.eventType !== "order.sent") return;

      let claimResult: ClaimOrderPrintJobOutput | null = null;

      try {
        updatePrintState(event.id, "claiming");

        const claimResponse =
          item.mode === "manual"
            ? await reprintOrderPrintJobRequest({
                restaurantId,
                eventId: event.id,
                printerId: DEFAULT_PRINTER_ID,
              })
            : await claimOrderPrintJobRequest({
                restaurantId,
                eventId: event.id,
                printerId: DEFAULT_PRINTER_ID,
              });

        if (!claimResponse.isValid || !claimResponse.result) {
          throw new Error(claimResponse.errorMessages[0] ?? "Unable to claim order print job");
        }

        claimResult = claimResponse.result;

        if (!claimResult.shouldPrint || !claimResult.printPayload) {
          const state = claimResult.status === "printed" ? "printed" : "skipped";

          updatePrintState(event.id, state, {
            attempts: claimResult.attemptCount,
            lastError: claimResult.lastError,
            jobId: claimResult.jobId,
          });

          if (item.mode === "manual" && claimResult.status === "printed") {
            toast("Cupom ja impresso", {
              description: "Este evento ja foi impresso para esta impressora.",
            });
          }

          return;
        }

        updatePrintState(event.id, "printing", {
          jobId: claimResult.jobId,
          attempts: claimResult.attemptCount,
          lastError: null,
        });

        await sendTicketToLocalPrintAgent(claimResult.printPayload);

        const completed = await completeOrderPrintJobRequest({
          restaurantId,
          jobId: claimResult.jobId,
          status: "printed",
        });

        if (!completed.isValid || !completed.result) {
          throw new Error(completed.errorMessages[0] ?? "Unable to confirm printed job");
        }

        clearRetryTimer(event.id);

        updatePrintState(event.id, "printed", {
          attempts: completed.result.attemptCount,
          lastError: completed.result.lastError,
          jobId: completed.result.jobId,
        });

        if (item.mode === "manual") {
          toast("Reimpressao concluida", {
            description: `Pedido #${event.orderNumber ?? "-"} enviado para impressora local.`,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected print execution error";

        let attempts = printStatesByEventId[event.id]?.attempts ?? 0;
        let jobId = claimResult?.jobId ?? null;

        if (claimResult?.jobId) {
          try {
            const failed = await completeOrderPrintJobRequest({
              restaurantId,
              jobId: claimResult.jobId,
              status: "failed",
              errorMessage: message,
            });

            if (failed.isValid && failed.result) {
              attempts = failed.result.attemptCount;
              jobId = failed.result.jobId;
            }
          } catch {
            // noop - keep local fallback state
          }
        }

        updatePrintState(event.id, "failed", {
          attempts,
          lastError: message,
          jobId,
        });

        if (item.mode === "auto") {
          const nextRetry = item.retry + 1;
          const scheduled = scheduleRetry(event.id, nextRetry);

          if (scheduled) {
            updatePrintState(event.id, "queued", {
              attempts,
              lastError: message,
              jobId,
            });
          } else {
            toast("Falha na impressao automatica", {
              description: `Pedido #${event.orderNumber ?? "-"}: ${message}`,
            });
          }

          return;
        }

        toast("Falha ao reimprimir", {
          description: message,
        });
      }
    },
    [
      clearRetryTimer,
      eventsById,
      printStatesByEventId,
      restaurantId,
      scheduleRetry,
      updatePrintState,
      printingEnabled,
    ]
  );

  useEffect(() => {
    const freshEventIds = collectAutoPrintableRealtimeOrderSentEventIds(
      events,
      seenRealtimeEventIdsRef.current,
      printingEnabled
    );

    for (const eventId of freshEventIds) {
      seenRealtimeEventIdsRef.current.add(eventId);
      enqueue(eventId, "auto", 0);
    }
  }, [enqueue, events, printingEnabled]);

  useEffect(() => {
    if (activeItem || queue.length === 0) return;

    const [first, ...rest] = queue;
    setActiveItem(first);
    setQueue(rest);
  }, [activeItem, queue]);

  useEffect(() => {
    if (!activeItem) return;

    let cancelled = false;

    void processQueueItem(activeItem).finally(() => {
      if (!cancelled) {
        setActiveItem(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeItem, processQueueItem]);

  useEffect(() => {
    let active = true;

    const runHealthCheck = async () => {
      const isOnline = await checkLocalPrintAgentHealth();
      if (active) setLocalAgentOnline(isOnline);
    };

    void runHealthCheck();

    const interval = setInterval(() => {
      void runHealthCheck();
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);

      for (const timer of retryTimersRef.current.values()) {
        clearTimeout(timer);
      }
      retryTimersRef.current.clear();
    };
  }, []);

  const manualReprint = useCallback(
    (eventId: string) => {
      if (!printingEnabled) {
        toast("Impressao desabilitada", {
          description: "Ative a impressao automatica para permitir reimpressao manual.",
        });
        return;
      }

      const event = eventsById.get(eventId);
      if (!event) return;

      if (event.eventType !== "order.sent") {
        toast("Reimpressao indisponivel", {
          description: "Somente eventos order.sent aceitam reimpressao.",
        });
        return;
      }

      enqueue(eventId, "manual", 0);
    },
    [enqueue, eventsById, printingEnabled]
  );

  return {
    printStatesByEventId,
    pendingJobsCount: queue.length + (activeItem ? 1 : 0),
    localAgentOnline,
    manualReprint,
  };
};


