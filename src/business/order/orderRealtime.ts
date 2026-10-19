import type { OrderStatus } from "@/business/order/orderState"

export type OrderRealtimeEvent = {
  eventId: string
  orderId: string
  eventVersion: number
  sequence: number
  status: OrderStatus
}

export type OrderRealtimeState = {
  status: OrderStatus
  lastSequence: number
  lastEventId: string | null
  needsResync: boolean
}

export function createOrderRealtimeState(status: OrderStatus): OrderRealtimeState {
  return {
    status,
    lastSequence: 0,
    lastEventId: null,
    needsResync: false,
  }
}

export function applyOrderRealtimeEvent(
  state: OrderRealtimeState,
  event: OrderRealtimeEvent,
):
  | { action: "applied" | "duplicate"; state: OrderRealtimeState }
  | { action: "resync"; state: OrderRealtimeState } {
  if (event.sequence <= state.lastSequence || event.eventId === state.lastEventId) {
    return { action: "duplicate", state }
  }

  if (event.sequence !== state.lastSequence + 1) {
    return {
      action: "resync",
      state: { ...state, needsResync: true },
    }
  }

  return {
    action: "applied",
    state: {
      status: event.status,
      lastSequence: event.sequence,
      lastEventId: event.eventId,
      needsResync: false,
    },
  }
}

export function reconcileOrderRealtimeSnapshot(
  state: OrderRealtimeState,
  snapshot: { status: OrderStatus; version: number },
): OrderRealtimeState {
  return {
    ...state,
    status: snapshot.status,
    lastSequence: Math.max(state.lastSequence, snapshot.version),
    needsResync: false,
  }
}
