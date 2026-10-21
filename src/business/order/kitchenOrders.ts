import type { OrderStatus } from "@/business/order/orderState"

export type KitchenOrder = {
  id: string
  status: OrderStatus
  tableLabel: string
  createdAt: Date
  updatedAt: Date
  items: Array<{
    name: string
    quantity: number
    note: string | null
  }>
}

export type KitchenOrdersRepository = {
  findOrders(input: {
    restaurantSlug: string
    userId: string
    statuses: OrderStatus[]
  }): Promise<{ restaurantId: string; orders: KitchenOrder[] } | null>
}

export class KitchenOrdersError extends Error {
  constructor(public readonly code: "KITCHEN_ACCESS_DENIED") {
    super(code)
  }
}

export async function listKitchenOrders(input: {
  repository: KitchenOrdersRepository
  restaurantSlug: string
  userId: string
  statuses: OrderStatus[]
}) {
  const found = await input.repository.findOrders({
    restaurantSlug: input.restaurantSlug,
    userId: input.userId,
    statuses: input.statuses,
  })

  if (!found) {
    throw new KitchenOrdersError("KITCHEN_ACCESS_DENIED")
  }

  return {
    restaurantId: found.restaurantId,
    orders: found.orders.map((order) => ({
      orderId: order.id,
      status: order.status,
      tableLabel: order.tableLabel,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items,
    })),
  }
}
