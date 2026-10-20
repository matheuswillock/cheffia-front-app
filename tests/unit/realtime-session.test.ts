import { expect, test } from "bun:test"

import {
  issueOrderRealtimeToken,
  type RealtimeSessionRepository,
} from "@/business/order/realtimeSession"

const repository: RealtimeSessionRepository = {
  async hasActiveSession(input) {
    expect(input.sessionTokenHash).toHaveLength(64)
    return input.orderId === "order-1"
  },
}

test("issues a token only for the active table session owning the order", async () => {
  const result = await issueOrderRealtimeToken({
    repository,
    orderId: "order-1",
    sessionId: "00000000-0000-0000-0000-000000000001",
    sessionToken: "session-token-12345678",
    jwtSecret: "jwt-secret",
  })

  expect(result.token.split(".")).toHaveLength(3)
})

test("denies a session that does not own the order", async () => {
  await expect(
    issueOrderRealtimeToken({
      repository,
      orderId: "order-2",
      sessionId: "00000000-0000-0000-0000-000000000001",
      sessionToken: "session-token-12345678",
      jwtSecret: "jwt-secret",
    }),
  ).rejects.toMatchObject({ code: "ORDER_NOT_AVAILABLE" })
})
