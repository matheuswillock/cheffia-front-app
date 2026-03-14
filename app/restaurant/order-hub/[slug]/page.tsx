"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useOrderHubRealtime } from "@/hooks/useOrderHubRealtime";
import type { OrderHubEventView } from "@/components/OrderHubContent/types";
import MoreDetails from "@/components/OrderHubContent/MoreDetails";
import OrderList from "@/components/OrderHubContent/OrderList";
import { useOrderHubPrintAutomation } from "@/app/restaurant/order-hub/[slug]/features/context/useOrderHubPrintAutomation";
import { checkLocalPrintAgentHealth } from "@/app/restaurant/order-hub/[slug]/features/services/order-hub-print.service";
import {
  readOrderHubPrintEnabledPreference,
  resolveOrderHubPrinterGateState,
  writeOrderHubPrintEnabledPreference,
} from "@/app/restaurant/order-hub/[slug]/features/services/order-hub-printer-preferences";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function OrderHubPage() {
  const { slug } = useParams<{ slug: string | string[] }>();
  const restaurantId = Array.isArray(slug) ? (slug[0] ?? "") : (slug ?? "");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [printingEnabled, setPrintingEnabled] = useState(false);
  const [canStartRealtime, setCanStartRealtime] = useState(false);
  const [showPrinterGateDialog, setShowPrinterGateDialog] = useState(false);
  const [isGateReady, setIsGateReady] = useState(false);

  const preflightRunIdRef = useRef(0);

  const applyPrintingPreference = useCallback(
    (enabled: boolean) => {
      if (!restaurantId) return;
      setPrintingEnabled(enabled);
      writeOrderHubPrintEnabledPreference(restaurantId, enabled);
    },
    [restaurantId]
  );

  useEffect(() => {
    if (!restaurantId) {
      setPrintingEnabled(false);
      setCanStartRealtime(false);
      setShowPrinterGateDialog(false);
      setIsGateReady(true);
      return;
    }

    const runId = preflightRunIdRef.current + 1;
    preflightRunIdRef.current = runId;
    setCanStartRealtime(false);
    setShowPrinterGateDialog(false);
    setIsGateReady(false);

    let active = true;

    const runPreflight = async () => {
      const storedPreference = readOrderHubPrintEnabledPreference(restaurantId);
      if (!active || runId !== preflightRunIdRef.current) return;
      setPrintingEnabled(storedPreference);

      const isPrinterAgentOnline = await checkLocalPrintAgentHealth();
      if (!active || runId !== preflightRunIdRef.current) return;

      const gateState = resolveOrderHubPrinterGateState(isPrinterAgentOnline);
      setCanStartRealtime(gateState.canStartRealtime);
      setShowPrinterGateDialog(gateState.shouldPromptOperator);
      setIsGateReady(true);
    };

    void runPreflight();

    return () => {
      active = false;
    };
  }, [restaurantId]);

  const handleEnablePrintingFromDialog = useCallback(() => {
    applyPrintingPreference(true);
    setShowPrinterGateDialog(false);
    setCanStartRealtime(true);
  }, [applyPrintingPreference]);

  const handleKeepPrintingDisabledFromDialog = useCallback(() => {
    applyPrintingPreference(false);
    setShowPrinterGateDialog(false);
    setCanStartRealtime(true);
  }, [applyPrintingPreference]);

  const handlePrintingSwitchChange = useCallback(
    (checked: boolean) => {
      applyPrintingPreference(checked);
    },
    [applyPrintingPreference]
  );

  const { events: realtimeEvents, connectionStatus, error } = useOrderHubRealtime(
    restaurantId,
    canStartRealtime
  );

  const events = useMemo<OrderHubEventView[]>(
    () =>
      realtimeEvents.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        status: event.status,
        createdAt: event.createdAt,
        source: event.source,
        restaurantId: event.restaurantId,
        orderId: event.orderId,
        orderNumber: event.orderNumber,
        tableNumber: event.tableNumber,
        transactionId: event.transactionId,
        paymentStatus: event.paymentStatus,
        payload: event.payload,
      })),
    [realtimeEvents]
  );

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  useEffect(() => {
    if (events.length === 0) {
      setSelectedEventId(null);
      return;
    }

    setSelectedEventId((current) => {
      if (current && events.some((event) => event.id === current)) {
        return current;
      }
      return events[0].id;
    });
  }, [events]);

  const { printStatesByEventId, pendingJobsCount, localAgentOnline, manualReprint } =
    useOrderHubPrintAutomation({
      restaurantId,
      events,
      printingEnabled,
    });

  return (
    <>
      <AlertDialog
        open={showPrinterGateDialog}
        onOpenChange={(open) => {
          if (open) {
            setShowPrinterGateDialog(true);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Impressora nao conectada</AlertDialogTitle>
            <AlertDialogDescription>
              Nenhuma impressora local foi detectada no momento. Escolha se deseja habilitar a
              impressao automatica mesmo assim ou manter desabilitado para esta sessao.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepPrintingDisabledFromDialog}>
              Manter desabilitado
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleEnablePrintingFromDialog}>Habilitar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="my-8 flex min-h-svh flex-1 flex-col items-center gap-6 px-8">
        <div className="flex w-max flex-initial flex-col gap-2 border-b-2 px-2">
          <h2 className="text-3xl text-foreground-default">Central de Pedidos</h2>
          <div className="flex flex-wrap items-center gap-3 py-1">
            <span className="text-sm text-muted-foreground/80">Impressao automatica</span>
            <Switch
              id="orderhub-print-enabled"
              checked={printingEnabled}
              onCheckedChange={handlePrintingSwitchChange}
            />
            <span className="text-sm text-muted-foreground/80">
              {localAgentOnline ? "Impressora conectada" : "Impressora nao conectada"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground/80">
            Realtime: {isGateReady ? connectionStatus : "AGUARDANDO_PREFLIGHT"}
          </p>
          <p className="text-sm text-muted-foreground/80">Fila de impressao: {pendingJobsCount}</p>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>

        <div className="grid max-h-[80vh] min-h-[80vh] w-[100%] grid-cols-4 gap-4 rounded-xl border-2">
          <div className="col-span-1 border-r-2">
            <h2 className="my-2 ml-4 text-3xl text-foreground-default">Pedidos</h2>
            <OrderList
              events={events}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
              printStatesByEventId={printStatesByEventId}
            />
          </div>

          <div className="col-span-3">
            <h2 className="my-2 ml-4 text-3xl text-foreground-default">Mais Detalhes</h2>
            <MoreDetails
              event={selectedEvent}
              printState={selectedEvent ? printStatesByEventId[selectedEvent.id] ?? null : null}
              onManualReprint={manualReprint}
            />
          </div>
        </div>
      </div>
    </>
  );
}

