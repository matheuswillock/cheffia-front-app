export type OrderPrintUiStatus =
  | "idle"
  | "queued"
  | "claiming"
  | "printing"
  | "printed"
  | "failed"
  | "skipped";

export interface OrderPrintUiState {
  status: OrderPrintUiStatus;
  attempts: number;
  lastError: string | null;
  jobId: string | null;
  updatedAt: string;
}

export interface OrderHubEventView {
  id: string;
  eventType: string;
  status: string;
  createdAt: string;
  source: "snapshot" | "realtime";
  restaurantId: string;
  orderId: string | null;
  orderNumber: number | null;
  tableNumber: string | null;
  transactionId: string | null;
  paymentStatus: string | null;
  payload: Record<string, unknown>;
}
