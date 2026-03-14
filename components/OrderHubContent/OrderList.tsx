import { NewOrder } from "./NewOrder";
import type { OrderHubEventView, OrderPrintUiState } from "./types";

interface OrderListProps {
  events: OrderHubEventView[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  printStatesByEventId: Record<string, OrderPrintUiState>;
}

export default function OrderList({
  events,
  selectedEventId,
  onSelectEvent,
  printStatesByEventId,
}: OrderListProps) {
  return (
    <div className="overflow-y-auto max-h-[72vh] mx-3">
      <div className="flex flex-col gap-3 px-2 py-6">
        {events.length === 0 ? (
          <div className="text-sm text-muted-foreground/70 border border-dashed rounded-lg p-3">
            Sem eventos de pedido para este restaurante.
          </div>
        ) : null}

        {events.map((event) => (
          <NewOrder
            key={event.id}
            event={event}
            selected={event.id === selectedEventId}
            onSelect={onSelectEvent}
            printState={printStatesByEventId[event.id]}
          />
        ))}
      </div>
    </div>
  );
}
