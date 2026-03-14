import type { OrderPrintTicketPayload } from "@/lib/printing/contracts";

export type OrderPrintJobStatus = "claimed" | "printed" | "failed";

export interface ClaimOrderPrintJobInput {
  restaurantId: string;
  eventId: string;
  printerId?: string | null;
}

export interface ClaimOrderPrintJobOutput {
  jobId: string;
  eventId: string;
  restaurantId: string;
  printerId: string;
  status: OrderPrintJobStatus;
  shouldPrint: boolean;
  replayed: boolean;
  attemptCount: number;
  lastError: string | null;
  printPayload: OrderPrintTicketPayload | null;
}

export interface CompleteOrderPrintJobInput {
  restaurantId: string;
  jobId: string;
  status: Extract<OrderPrintJobStatus, "printed" | "failed">;
  errorMessage?: string | null;
}

export interface CompleteOrderPrintJobOutput {
  jobId: string;
  eventId: string;
  restaurantId: string;
  printerId: string;
  status: OrderPrintJobStatus;
  attemptCount: number;
  lastError: string | null;
}

export interface ReprintOrderPrintJobInput {
  restaurantId: string;
  eventId: string;
  printerId?: string | null;
}
