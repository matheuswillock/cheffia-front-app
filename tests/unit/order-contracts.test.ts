import { describe, expect, test } from "bun:test"

import {
  createOrderRequestSchema,
  getIdempotencyKey,
  hashOrderRequest,
} from "@/business/order/orderContracts"

const menuItemId = "00000000-0000-0000-0000-000000000001"
const modifierId = "00000000-0000-0000-0000-000000000002"

describe("public order contracts", () => {
  test("accepts a bounded cart without trusting a client total", () => {
    const result = createOrderRequestSchema.safeParse({
      sessionId: "00000000-0000-0000-0000-000000000003",
      sessionToken: "session-token-12345678",
      note: "Sem cebola",
      items: [{ menuItemId, quantity: 2, modifierIds: [modifierId] }],
    })

    expect(result.success).toBe(true)
  })

  test("rejects client totals and invalid quantities", () => {
    const result = createOrderRequestSchema.safeParse({
      sessionId: "00000000-0000-0000-0000-000000000003",
      sessionToken: "session-token-12345678",
      totalCents: 1,
      items: [{ menuItemId, quantity: 0 }],
    })

    expect(result.success).toBe(false)
  })

  test("rejects notes longer than the API bound", () => {
    const result = createOrderRequestSchema.safeParse({
      sessionId: "00000000-0000-0000-0000-000000000003",
      sessionToken: "session-token-12345678",
      note: "x".repeat(501),
      items: [{ menuItemId, quantity: 1 }],
    })

    expect(result.success).toBe(false)
  })

  test("requires a safe idempotency key", () => {
    expect(getIdempotencyKey(new Headers({ "Idempotency-Key": "order-123" }))).toBe(
      "order-123",
    )
    expect(getIdempotencyKey(new Headers())).toBeNull()
    expect(getIdempotencyKey(new Headers({ "Idempotency-Key": "x".repeat(129) }))).toBeNull()
  })

  test("hashes equivalent modifier ordering to the same request", async () => {
    const first = {
      sessionId: "00000000-0000-0000-0000-000000000003",
      sessionToken: "session-token-12345678",
      items: [{ menuItemId, quantity: 1, modifierIds: [modifierId, menuItemId] }],
    }
    const second = {
      sessionId: first.sessionId,
      sessionToken: first.sessionToken,
      items: [{ menuItemId, quantity: 1, modifierIds: [menuItemId, modifierId] }],
    }

    expect(await hashOrderRequest(first)).toBe(await hashOrderRequest(second))
  })
})
