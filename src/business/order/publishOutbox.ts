import type { OrderStatus } from "@/business/order/orderState"

export type PendingOutboxEvent = {
  id: string
  restaurantId: string
  aggregateId: string
  eventType: string
  sequence: bigint | number
  payload: unknown
  leaseToken: string
}

export type OrderBroadcastPayload = {
  eventId: string
  sequence: number
  eventType: string
  orderId: string
  status: OrderStatus
  version: number
}

export function orderBroadcastPayload(event: PendingOutboxEvent): OrderBroadcastPayload | null {
  const payload = event.payload as { orderId?: unknown; status?: unknown; version?: unknown }
  if (payload.orderId !== event.aggregateId || typeof payload.status !== "string" || typeof payload.version !== "number") return null
  return {
    // Version is contiguous per aggregate; the outbox sequence remains the durable
    // global delivery order, while clients need a sequence they can reconcile from
    // the persisted order snapshot.
    eventId: event.id, sequence: payload.version, eventType: event.eventType,
    orderId: event.aggregateId, status: payload.status as OrderStatus, version: payload.version,
  }
}

export async function publishOrderOutboxEvent(input: {
  event: PendingOutboxEvent
  publish: (topic: string, payload: OrderBroadcastPayload) => Promise<void>
}) {
  const payload = orderBroadcastPayload(input.event)
  if (!payload) throw new Error("INVALID_ORDER_OUTBOX_PAYLOAD")
  await input.publish(`order:${input.event.aggregateId}`, payload)
  await input.publish(`restaurant:${input.event.restaurantId}:orders`, payload)
}
