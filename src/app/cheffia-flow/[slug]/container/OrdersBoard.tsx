import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { OrdersCard } from "./OrdersCard";
import { NewRequestOrder } from "@/models/cheffiaFlowModels/NewRequestOrder";
import { OrderItem } from "@/models/cheffiaFlowModels/OrderItem";

const statusLabels = {
  recebido: "Recebidos",
  preparo: "Em preparo",
  pronto: "Pronto"
};

interface OrdersBoardProps {
  orders: NewRequestOrder[];
  onStatusChange: (
    orderId: string,
    orderItemNumber: number,
    newStatus: string
  ) => void;
}

export function OrdersBoard({ orders, onStatusChange }: OrdersBoardProps) {
  type StatusKey = "recebido" | "preparo" | "pronto";

  type ItemWithOrder = { item: OrderItem; orderId: string };

  const columns: Record<StatusKey, ItemWithOrder[]> = {
    recebido: [],
    preparo: [],
    pronto: [],
  };

  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const status = item.orderItemStatus?.toLowerCase();
      if (status === "received") {
        columns.recebido.push({ item, orderId: order.customerOrderId });
      } else if (status === "cooking") {
        columns.preparo.push({ item, orderId: order.customerOrderId });
      } else if (status === "ready") {
        columns.pronto.push({ item, orderId: order.customerOrderId });
      }
    });
  });

  function onDragEnd(result: any) {
    if (!result.destination) return;
    const sourceCol = result.source.droppableId as StatusKey;
    const destCol = result.destination.droppableId as StatusKey;
    if (sourceCol === destCol) return;
    const [orderId, orderNumberStr] = result.draggableId.split("-");
    const orderNumber = Number(orderNumberStr);
    const statusMap: Record<StatusKey, string> = {
      recebido: "Received",
      preparo: "Cooking",
      pronto: "Ready",
    };
    onStatusChange(orderId, orderNumber, statusMap[destCol]);
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
                {orders.map(({ item, orderId }, idx) => (
                  <Draggable
                    key={`${orderId}-${item.orderNumber}`}
                    draggableId={`${orderId}-${item.orderNumber}`}
                    index={idx}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <OrdersCard
                          key={`${orderId}-${item.orderNumber}`}
                          order={item}
                          onAction={() => {
                            const next =
                              item.orderItemStatus === "Received"
                                ? "Cooking"
                                : item.orderItemStatus === "Cooking"
                                ? "Ready"
                                : "Ready";
                            onStatusChange(orderId, item.orderNumber, next);
                          }}
                        />
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
