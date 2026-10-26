import { expect, test } from "bun:test"

import {
  applyOrderRealtimeEvent,
  createOrderRealtimeState,
  reconcileOrderRealtimeSnapshot,
  type OrderRealtimeEvent,
} from "@/business/order/orderRealtime"

const event = (sequence: number, status: OrderRealtimeEvent["status"]): OrderRealtimeEvent => ({
  eventId: `event-${sequence}`,
  orderId: "order-1",
  eventVersion: 1,
  sequence,
  status,
})

test("applies the next event exactly once", () => {
  const initial = createOrderRealtimeState("pending")
  const applied = applyOrderRealtimeEvent(initial, event(1, "confirmed"))

  expect(applied).toEqual({
    action: "applied",
    state: { status: "confirmed", lastSequence: 1, lastEventId: "event-1", needsResync: false },
  })
})

test("deduplicates repeated and old events", () => {
  const initial = applyOrderRealtimeEvent(
    createOrderRealtimeState("pending"),
    event(1, "confirmed"),
  ).state

  expect(applyOrderRealtimeEvent(initial, event(1, "confirmed")).action).toBe("duplicate")
  expect(applyOrderRealtimeEvent(initial, event(0, "pending")).action).toBe("duplicate")
})

test("requests a snapshot resync when a sequence gap is detected", () => {
  const initial = applyOrderRealtimeEvent(
    createOrderRealtimeState("pending"),
    event(1, "confirmed"),
  ).state

  expect(applyOrderRealtimeEvent(initial, event(3, "preparing"))).toEqual({
    action: "resync",
    state: { ...initial, needsResync: true },
  })
})

test("reconciles a snapshot without moving the cursor backwards", () => {
  const state = {
    ...createOrderRealtimeState("pending"),
    lastSequence: 4,
    lastEventId: "event-4",
    needsResync: true,
  }

  expect(reconcileOrderRealtimeSnapshot(state, { status: "preparing", version: 2 })).toEqual({
    status: "preparing",
    lastSequence: 4,
    lastEventId: "event-4",
    needsResync: false,
  })
})
