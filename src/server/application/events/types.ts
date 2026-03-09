import type { Prisma } from "@prisma/client";

export type OutboxAggregateType = "customer_order";

export type OutboxEventType =
  | "order.sent"
  | "order.payment.requested"
  | "order.payment.confirmed";

export interface EnqueueOutboxEventInput {
  tenantId: string;
  aggregateType: OutboxAggregateType;
  aggregateId: string;
  eventType: OutboxEventType;
  payload: Prisma.JsonObject;
  status?: "pending" | "published" | "failed";
}
