import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma, withPrismaRetry } from "@/app/api/infra/prisma";
import type {
  OrderPrintEventSnapshot,
  OrderPrintOrderSnapshot,
  OrderPrintOrderItemSnapshot,
} from "@/app/api/services/orderPrint";

const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toIso = (value: Date): string => value.toISOString();

const normalizeObservation = (value: string | null): string => {
  const trimmed = (value ?? "").trim();
  return trimmed;
};

interface OutboxEventRow {
  id: string;
  tenantId: string;
  eventType: string;
  aggregateId: string;
  payload: Prisma.JsonValue;
  createdAt: Date;
}

export class PrismaOrderPrintReadRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  public async findEventById(
    tenantId: string,
    eventId: string
  ): Promise<OrderPrintEventSnapshot | null> {
    const row = await withPrismaRetry(
      () =>
        this.prisma.outboxEvent.findFirst({
          where: {
            id: eventId,
            tenantId,
          },
          select: {
            id: true,
            tenantId: true,
            eventType: true,
            aggregateId: true,
            payload: true,
            createdAt: true,
          },
        }),
      { label: "orderprint.read.findEventById" }
    );

    if (!row) return null;

    const typedRow = row as OutboxEventRow;
    const payload = asObject(typedRow.payload);

    const restaurantId = readString(payload.restaurantId);
    const customerOrderId = readString(payload.orderId) ?? readString(typedRow.aggregateId);

    if (!restaurantId || !customerOrderId) {
      return null;
    }

    return {
      eventId: typedRow.id,
      tenantId: typedRow.tenantId,
      restaurantId,
      customerOrderId,
      eventType: typedRow.eventType,
      createdAt: toIso(typedRow.createdAt),
    };
  }

  public async findOrderById(
    tenantId: string,
    restaurantId: string,
    customerOrderId: string
  ): Promise<OrderPrintOrderSnapshot | null> {
    const order = await withPrismaRetry(
      () =>
        this.prisma.customerOrder.findFirst({
          where: {
            id: customerOrderId,
            tenantId,
            restaurantId,
          },
          include: {
            items: {
              orderBy: { createdAt: "asc" },
            },
          },
        }),
      { label: "orderprint.read.findOrderById" }
    );

    if (!order) return null;

    const items: OrderPrintOrderItemSnapshot[] = order.items.map((item) => ({
      quantity: item.quantity,
      itemName: item.name,
      observation: normalizeObservation(item.comments),
    }));

    return {
      customerOrderId: order.id,
      restaurantId: order.restaurantId,
      orderDateTime: toIso(order.orderDate),
      orderNumber: order.orderNumber,
      tableOrCounter: order.tableNumber,
      items,
    };
  }
}
