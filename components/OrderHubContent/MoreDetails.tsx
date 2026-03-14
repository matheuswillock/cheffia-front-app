import { Button } from "@/components/ui/button";
import type { OrderHubEventView, OrderPrintUiState } from "./types";

interface MoreDetailsProps {
  event: OrderHubEventView | null;
  printState: OrderPrintUiState | null;
  onManualReprint: (eventId: string) => void;
}

const formatPayload = (payload: Record<string, unknown>): string => JSON.stringify(payload, null, 2);

const printStatusLabel = (status: OrderPrintUiState["status"]): string => {
  if (status === "queued") return "Na fila";
  if (status === "claiming") return "Executando claim";
  if (status === "printing") return "Imprimindo";
  if (status === "printed") return "Impresso";
  if (status === "failed") return "Falhou";
  if (status === "skipped") return "Ignorado";
  return "Aguardando";
};

export default function MoreDetails({ event, printState, onManualReprint }: MoreDetailsProps) {
  if (!event) {
    return (
      <div className="border-2 bg-gray-700 border-muted-foreground/40 rounded-xl ml-4 min-h-[90%] max-h-[90%] max-w-[96%] overflow-y-auto flex items-center justify-center">
        <p className="text-muted-foreground/70">Selecione um evento para ver os detalhes.</p>
      </div>
    );
  }

  const eventDate = new Date(event.createdAt).toLocaleString("pt-BR");
  const canReprint = event.eventType === "order.sent";
  const isBusy = printState?.status === "claiming" || printState?.status === "printing";

  return (
    <div className="border-2 bg-gray-700 border-muted-foreground/40 rounded-xl ml-4 min-h-[90%] max-h-[90%] max-w-[96%] overflow-y-auto flex flex-col gap-3 px-4 py-6 justify-between">
      <div className="flex flex-col gap-8">
        <div className="flex flex-row justify-between">
          <h2 className="text-4xl text-foreground-default">Mesa {event.tableNumber ?? "-"}</h2>
          <h1 className="text-2xl text-muted-foreground">Pedido #{event.orderNumber ?? "-"}</h1>
        </div>

        <div className="flex flex-col gap-2 border-b-2 border-muted-foreground/40 pb-4">
          <p className="text-lg text-muted-foreground/90">Evento: {event.eventType}</p>
          <p className="text-sm text-muted-foreground/80">Criado em: {eventDate}</p>
          <p className="text-sm text-muted-foreground/80">Status outbox: {event.status}</p>
          {event.paymentStatus ? (
            <p className="text-sm text-emerald-300">Status pagamento: {event.paymentStatus}</p>
          ) : null}
          {event.transactionId ? (
            <p className="text-xs text-muted-foreground/70">Transacao: {event.transactionId}</p>
          ) : null}

          {printState ? (
            <>
              <p className="text-sm text-blue-300">
                Status impressao: {printStatusLabel(printState.status)} (tentativas: {printState.attempts})
              </p>
              {printState.lastError ? (
                <p className="text-xs text-red-300">Ultimo erro: {printState.lastError}</p>
              ) : null}
            </>
          ) : null}

          {canReprint ? (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => onManualReprint(event.id)}
                disabled={isBusy}
              >
                {isBusy ? "Processando..." : "Reimprimir cupom"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground/80">Payload</p>
        <pre className="bg-black/30 rounded-lg p-3 text-xs text-muted-foreground/90 overflow-auto max-h-[280px]">
          {formatPayload(event.payload)}
        </pre>
      </div>
    </div>
  );
}
