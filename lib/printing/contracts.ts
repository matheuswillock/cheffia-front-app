export type PrintPaperProfile = "58mm" | "80mm" | "auto";

export interface OrderPrintTicketItem {
  quantity: number;
  itemName: string;
  observation: string;
}

export interface OrderPrintTicketPayload {
  eventId: string;
  restaurantId: string;
  customerOrderId: string;
  orderNumber: number;
  orderDateTime: string;
  tableOrCounter: string;
  serviceMode: string;
  items: OrderPrintTicketItem[];
}

