import { hashOrderRequest, type CreateOrderRequest } from "@/business/order/orderContracts"
import { priceOrderItems, type CatalogMenuItem, type OrderItemSnapshot } from "@/business/order/orderPricing"
import { hashSessionToken } from "@/business/order/tableToken"
import type { OrderStatus } from "@/business/order/orderState"

type OrderResponse = {
  orderId: string
  status: OrderStatus
  totalCents: number
}

type IdempotencyRecord = {
  requestHash: string | null
  status: "started" | "completed" | "failed"
  responseBody?: OrderResponse
}

type OrderTransaction = {
  findActiveSession(input: {
    sessionId: string
    sessionTokenHash: string
    now: Date
  }): Promise<{ tenantId: string; restaurantId: string; tableId: string } | null>
  claimIdempotency(input: {
    tenantId: string
    restaurantId: string
    method: string
    endpoint: string
    idempotencyKey: string
    requestHash: string
    expiresAt: Date
  }): Promise<{ created: boolean; record: IdempotencyRecord }>
  findCatalogItems(input: {
    tenantId: string
    restaurantId: string
    menuItemIds: string[]
  }): Promise<CatalogMenuItem[]>
  createOrder(input: {
    tenantId: string
    restaurantId: string
    tableId: string
    sessionId: string
    note: string | null
    currency: string
    subtotalCents: number
    totalCents: number
    items: OrderItemSnapshot[]
  }): Promise<{ id: string; status: OrderStatus; totalCents: number }>
  createOutboxEvent(input: {
    tenantId: string
    restaurantId: string
    aggregateId: string
    payload: Record<string, unknown>
  }): Promise<void>
  completeIdempotency(input: {
    tenantId: string
    method: string
    endpoint: string
    idempotencyKey: string
    requestHash: string
    responseBody: OrderResponse
  }): Promise<void>
}

export type OrderCreationRepository = {
  transaction<T>(callback: (transaction: OrderTransaction) => Promise<T>): Promise<T>
}

export class CreateOrderError extends Error {
  constructor(
    public readonly code:
      | "INVALID_ORDER_SESSION"
      | "IDEMPOTENCY_KEY_REUSE"
      | "IDEMPOTENCY_IN_PROGRESS",
  ) {
    super(code)
  }
}

export async function createOrder(input: {
  repository: OrderCreationRepository
  request: CreateOrderRequest
  idempotencyKey: string
  now?: Date
}) {
  const now = input.now ?? new Date()
  const requestHash = await hashOrderRequest(input.request)

  return input.repository.transaction(async (transaction) => {
    const session = await transaction.findActiveSession({
      sessionId: input.request.sessionId,
      sessionTokenHash: hashSessionToken(input.request.sessionToken),
      now,
    })
    if (!session) {
      throw new CreateOrderError("INVALID_ORDER_SESSION")
    }

    const idempotency = await transaction.claimIdempotency({
      tenantId: session.tenantId,
      restaurantId: session.restaurantId,
      method: "POST",
      endpoint: "/api/public/orders",
      idempotencyKey: input.idempotencyKey,
      requestHash,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    })

    if (!idempotency.created) {
      if (idempotency.record.requestHash !== requestHash) {
        throw new CreateOrderError("IDEMPOTENCY_KEY_REUSE")
      }
      if (idempotency.record.status === "completed" && idempotency.record.responseBody) {
        return idempotency.record.responseBody
      }
      throw new CreateOrderError("IDEMPOTENCY_IN_PROGRESS")
    }

    const catalog = await transaction.findCatalogItems({
      tenantId: session.tenantId,
      restaurantId: session.restaurantId,
      menuItemIds: input.request.items.map((item) => item.menuItemId),
    })
    const priced = priceOrderItems(input.request.items, catalog)
    const order = await transaction.createOrder({
      tenantId: session.tenantId,
      restaurantId: session.restaurantId,
      tableId: session.tableId,
      sessionId: input.request.sessionId,
      note: input.request.note ?? null,
      currency: priced.currency,
      subtotalCents: priced.subtotalCents,
      totalCents: priced.totalCents,
      items: priced.items,
    })
    const response = {
      orderId: order.id,
      status: order.status,
      totalCents: order.totalCents,
    }

    await transaction.createOutboxEvent({
      tenantId: session.tenantId,
      restaurantId: session.restaurantId,
      aggregateId: order.id,
      payload: {
        orderId: order.id,
        status: order.status,
        totalCents: order.totalCents,
      },
    })
    await transaction.completeIdempotency({
      tenantId: session.tenantId,
      method: "POST",
      endpoint: "/api/public/orders",
      idempotencyKey: input.idempotencyKey,
      requestHash,
      responseBody: response,
    })

    return response
  })
}
