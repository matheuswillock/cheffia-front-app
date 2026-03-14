import type { Prisma } from "@prisma/client";
import type { EnqueueOutboxEventInput } from "./types";

interface EnqueueOrderSentInput {
  tenantId: string;
  customerOrderId: string;
  restaurantId: string;
  orderNumber: number;
  tableNumber: string;
}

interface EnqueueOrderPaymentRequestedInput {
  tenantId: string;
  customerOrderId: string;
  restaurantId: string;
  transactionId: string;
  status: string;
}

interface EnqueueOrderPaymentConfirmedInput {
  tenantId: string;
  customerOrderId: string;
  restaurantId: string;
  transactionId: string;
  status: string;
}

export class OutboxEventsService {
  public async enqueue(
    tx: Prisma.TransactionClient,
    input: EnqueueOutboxEventInput
  ): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        tenantId: input.tenantId,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        eventType: input.eventType,
        payload: input.payload,
        status: input.status ?? "pending",
      },
    });
  }

  public async enqueueOrderSent(
    tx: Prisma.TransactionClient,
    input: EnqueueOrderSentInput
  ): Promise<void> {
    await this.enqueue(tx, {
      tenantId: input.tenantId,
      aggregateType: "customer_order",
      aggregateId: input.customerOrderId,
      eventType: "order.sent",
      payload: {
        restaurantId: input.restaurantId,
        orderId: input.customerOrderId,
        orderNumber: input.orderNumber,
        tableNumber: input.tableNumber,
      },
    });
  }

  public async enqueueOrderPaymentRequested(
    tx: Prisma.TransactionClient,
    input: EnqueueOrderPaymentRequestedInput
  ): Promise<void> {
    await this.enqueue(tx, {
      tenantId: input.tenantId,
      aggregateType: "customer_order",
      aggregateId: input.customerOrderId,
      eventType: "order.payment.requested",
      payload: {
        restaurantId: input.restaurantId,
        orderId: input.customerOrderId,
        transactionId: input.transactionId,
        status: input.status,
      },
    });
  }

  public async enqueueOrderPaymentConfirmed(
    tx: Prisma.TransactionClient,
    input: EnqueueOrderPaymentConfirmedInput
  ): Promise<void> {
    await this.enqueue(tx, {
      tenantId: input.tenantId,
      aggregateType: "customer_order",
      aggregateId: input.customerOrderId,
      eventType: "order.payment.confirmed",
      payload: {
        restaurantId: input.restaurantId,
        orderId: input.customerOrderId,
        transactionId: input.transactionId,
        status: input.status,
      },
    });
  }
}
