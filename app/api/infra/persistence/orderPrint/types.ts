import type { OrderPrintJobStatus } from "@/lib/printing/jobContracts";

export interface OrderPrintJobRecord {
  id: string;
  tenantId: string;
  eventId: string;
  restaurantId: string;
  printerId: string;
  status: OrderPrintJobStatus;
  attemptCount: number;
  lastError: string | null;
  payloadSnapshot: unknown;
  claimedAt: string | null;
  printedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
