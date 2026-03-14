import type { OrderPrintTicketPayload } from "@/lib/printing/contracts";

export interface OrderPrintEventSnapshot {
  eventId: string;
  tenantId: string;
  restaurantId: string;
  customerOrderId: string;
  eventType: string;
  createdAt: string;
}

export interface OrderPrintOrderItemSnapshot {
  quantity: number;
  itemName: string;
  observation: string;
}

export interface OrderPrintOrderSnapshot {
  customerOrderId: string;
  restaurantId: string;
  orderDateTime: string;
  orderNumber: number;
  tableOrCounter: string;
  items: OrderPrintOrderItemSnapshot[];
}

const DEFAULT_SERVICE_MODE = "Nao informado";
const SUPPORTED_EVENT = "order.sent";

const normalize = (value: string | null | undefined): string => {
  const trimmed = (value ?? "").trim();
  return trimmed;
};

export class OrderPrintService {
  public isSupportedEventType(eventType: string): boolean {
    return eventType.trim().toLowerCase() === SUPPORTED_EVENT;
  }

  public buildTicketPayload(
    event: OrderPrintEventSnapshot,
    order: OrderPrintOrderSnapshot
  ): OrderPrintTicketPayload {
    const tableOrCounter = normalize(order.tableOrCounter) || "-";

    return {
      eventId: event.eventId,
      restaurantId: order.restaurantId,
      customerOrderId: order.customerOrderId,
      orderNumber: order.orderNumber,
      orderDateTime: order.orderDateTime,
      tableOrCounter,
      serviceMode: DEFAULT_SERVICE_MODE,
      items: order.items.map((item) => ({
        quantity: Math.max(1, Number(item.quantity) || 1),
        itemName: normalize(item.itemName) || "Item sem nome",
        observation: normalize(item.observation),
      })),
    };
  }
}
