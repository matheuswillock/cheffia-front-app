import { Button } from "@/components/ui/button";
import { OrderItem } from "@/models/cheffiaFlowModels/OrderItem";

interface OrdersCardProps {
  order: OrderItem;
  onAction: () => void;
}

export function OrdersCard({ order, onAction }: OrdersCardProps) {
  return (
    <div className="rounded-lg border bg-background-default p-4 mb-4 shadow flex flex-col gap-2">
      <div className="font-bold text-lg">Pedido #{order.orderNumber}</div>
      <div className="text-sm text-muted-foreground">
        Mesa {order.tableNumber}
      </div>
      {/* <div className="flex gap-2 text-base">
        {order.items.map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div> */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs">
          {new Date(order.dispatchDate).toLocaleString()}
        </span>
        <Button
          size="sm"
          className="
              text-sm
              font-medium
              font-inter
              bg-background-green
              hover:bg-background-green/90
              text-foreground-black
              rounded-lg
              px-2
              transition-colors
              duration-200
              flex
              items-center
              justify-between
            "
          onClick={onAction}
        >
          {order.orderItemStatus === "Received" && "Em preparo"}
          {order.orderItemStatus === "Cooking" && "Pronto"}
          {order.orderItemStatus === "Ready" && "Finalizar"}
        </Button>
      </div>
    </div>
  );
}
