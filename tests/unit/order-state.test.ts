import { describe, expect, test } from "bun:test"

import { transitionOrder } from "@/business/order/orderState"

describe("order state transitions", () => {
  test("allows kitchen to confirm a pending order", () => {
    expect(transitionOrder("pending", "confirmed", { role: "kitchen" })).toEqual({
      ok: true,
    })
  })

  test("allows a customer to cancel before preparation", () => {
    expect(transitionOrder("confirmed", "cancelled", { role: "customer" })).toEqual({
      ok: true,
    })
  })

  test("rejects customer cancellation after preparation starts", () => {
    expect(transitionOrder("preparing", "cancelled", { role: "customer" })).toEqual({
      ok: false,
      code: "ORDER_TRANSITION_NOT_ALLOWED",
    })
  })

  test("requires a reason when kitchen rejects an order", () => {
    expect(transitionOrder("pending", "rejected", { role: "kitchen" })).toEqual({
      ok: false,
      code: "ORDER_REJECTION_REASON_REQUIRED",
    })
  })

  test("allows a reasoned kitchen rejection", () => {
    expect(
      transitionOrder("confirmed", "rejected", {
        role: "kitchen",
        reason: "Item indisponível",
      }),
    ).toEqual({ ok: true })
  })

  test("rejects skipping operational states", () => {
    expect(transitionOrder("pending", "delivered", { role: "kitchen" })).toEqual({
      ok: false,
      code: "ORDER_TRANSITION_NOT_ALLOWED",
    })
  })
})
