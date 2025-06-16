import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { OrdersCard } from "./OrdersCard";
import { NewRequestOrder } from "@/models/cheffiaFlowModels/NewRequestOrder";

const statusLabels = {
  recebido: "Recebidos",
  preparo: "Em preparo",
  pronto: "Pronto"
};

interface OrdersBoardProps {
  orders: NewRequestOrder[];
  onStatusChange: (
    id: string,
    newStatus: NewRequestOrder["orderStatus"]
  ) => void;
}

export function OrdersBoard({ orders, onStatusChange }: OrdersBoardProps) {
  type StatusKey = "recebido" | "preparo" | "pronto";

  // Derive as colunas diretamente dos pedidos recebidos via props
  const columns: Record<StatusKey, NewRequestOrder[]> = {
    recebido: orders.filter((p) => p.orderStatus === "recebido"),
    preparo: orders.filter((p) => p.orderStatus === "preparo"),
    pronto: orders.filter((p) => p.orderStatus === "pronto"),
  };

  function onDragEnd(result: any) {
    if (!result.destination) return;
    const sourceCol = result.source.droppableId as StatusKey;
    const destCol = result.destination.droppableId as StatusKey;
    if (sourceCol === destCol) return;

    const sourcePedidos = Array.from(columns[sourceCol]);
    const [removed] = sourcePedidos.splice(result.source.index, 1);
    // Atualiza o status do pedido via callback do pai
    onStatusChange(removed.customerOrderId, destCol as NewRequestOrder["orderStatus"]);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(columns).map(([status, orders]) => (
          <Droppable droppableId={status} key={status}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="shadow-md rounded-lg border-2 w-full min-h-[300px] bg-background-card p-2"
              >
                <div className="flex items-center justify-center w-full px-4 pt-2 pb-4">
                  <h2 className="text-2xl text-foreground-white font-inter font-semibold text-center">
                    {statusLabels[status as StatusKey]}
                  </h2>
                </div>
                {orders.map((order, idx) => (
                  <Draggable
                    key={order.customerOrderId}
                    draggableId={order.customerOrderId}
                    index={idx}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {order.orderItems.map((item, idx) => (
                          <OrdersCard
                            key={`${order.customerOrderId}-${item.orderNumber}-${idx}`}
                            order={item}
                            onAction={() => {
                              const next =
                                order.orderStatus === "recebido"
                                  ? "preparo"
                                  : order.orderStatus === "preparo"
                                  ? "pronto"
                                  : "pronto";
                              onStatusChange(
                                order.customerOrderId,
                                next as NewRequestOrder["orderStatus"]
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
