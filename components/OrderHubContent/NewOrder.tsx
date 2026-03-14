import type { OrderHubEventView, OrderPrintUiState } from "./types";

interface NewOrderProps {
  event: OrderHubEventView;
  selected: boolean;
  onSelect: (eventId: string) => void;
  printState?: OrderPrintUiState;
}

const eventLabel = (eventType: string): string => {
  if (eventType === "order.sent") return "Novo pedido";
  if (eventType === "order.payment.requested") return "Pagamento solicitado";
  if (eventType === "order.payment.confirmed") return "Pagamento confirmado";
  return eventType;
};

const printStatusLabel = (status: OrderPrintUiState["status"]): string => {
  if (status === "queued") return "na fila";
  if (status === "claiming") return "claim";
  if (status === "printing") return "imprimindo";
  if (status === "printed") return "impresso";
  if (status === "failed") return "falhou";
  if (status === "skipped") return "ignorado";
  return "aguardando";
};

export function NewOrder({ event, selected, onSelect, printState }: NewOrderProps) {
  const eventTime = new Date(event.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      type="button"
      onClick={() => onSelect(event.id)}
      className={`border-2 p-3 rounded-xl min-h-full max-h-full overflow-y-auto cursor-pointer text-left transition-colors ${
        selected
          ? "bg-emerald-900/60 border-emerald-500"
          : "bg-gray-700 border-muted-foreground/40 hover:bg-gray-600"
      }`}
    >
      <p className="text-base text-muted-foreground/90">{eventLabel(event.eventType)}</p>
      <p className="text-sm text-muted-foreground/80">
        Pedido #{event.orderNumber ?? "-"} | Mesa {event.tableNumber ?? "-"}
      </p>
      <p className="text-xs text-muted-foreground/70">
        {event.status} | {eventTime}
      </p>
      {event.paymentStatus ? (
        <p className="text-xs text-emerald-300 mt-1">Status pagamento: {event.paymentStatus}</p>
      ) : null}
      {printState ? (
        <p className="text-xs text-blue-300 mt-1">
          Impressao: {printStatusLabel(printState.status)} | tentativas {printState.attempts}
        </p>
      ) : null}
    </button>
  );
}
