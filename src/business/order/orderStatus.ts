import type { OrderStatus } from "@/business/order/orderState"
import { hashSessionToken } from "@/business/order/tableToken"

export type PublicOrderStatus = {
  id: string
  status: OrderStatus
  version: number
  totalCents: number
  currency: string
  createdAt: Date
  updatedAt: Date
  items: Array<{
    nameSnapshot: string
    quantity: number
    lineTotalCents: number
  }>
}

export type PublicOrderStatusRepository = {
  findOrder(input: {
    orderId: string
    sessionId: string
    sessionTokenHash: string
    now: Date
  }): Promise<PublicOrderStatus | null>
}

export class PublicOrderStatusError extends Error {
  constructor(public readonly code: "ORDER_NOT_AVAILABLE") {
    super(code)
  }
}

export async function getPublicOrderStatus(input: {
  repository: PublicOrderStatusRepository
  orderId: string
  sessionId: string
  sessionToken: string
  now?: Date
}) {
  const order = await input.repository.findOrder({
    orderId: input.orderId,
    sessionId: input.sessionId,
    sessionTokenHash: hashSessionToken(input.sessionToken),
    now: input.now ?? new Date(),
  })

  if (!order) {
    throw new PublicOrderStatusError("ORDER_NOT_AVAILABLE")
  }

  return {
    orderId: order.id,
    status: order.status,
    version: order.version,
    totalCents: order.totalCents,
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      name: item.nameSnapshot,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
  }
}
