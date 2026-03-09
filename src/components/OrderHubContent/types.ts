export interface OrderHubEventView {
  id: string;
  eventType: string;
  status: string;
  createdAt: string;
  restaurantId: string;
  orderId: string | null;
  orderNumber: number | null;
  tableNumber: string | null;
  transactionId: string | null;
  paymentStatus: string | null;
  payload: Record<string, unknown>;
}
