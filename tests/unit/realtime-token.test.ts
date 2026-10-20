import { expect, test } from "bun:test"

import { createSupabaseRealtimeToken } from "@/business/order/realtimeToken"

test("issues a short-lived session-scoped Supabase Realtime token", () => {
  const token = createSupabaseRealtimeToken({
    sessionId: "00000000-0000-0000-0000-000000000001",
    jwtSecret: "local-jwt-secret",
    now: new Date("2026-10-20T12:00:00.000Z"),
  })
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"))

  expect(payload.role).toBe("anon")
  expect(payload.table_session_id).toBe("00000000-0000-0000-0000-000000000001")
  expect(payload.exp - payload.iat).toBe(300)
  expect(token.split(".")).toHaveLength(3)
})

test("requires a JWT signing secret", () => {
  expect(() =>
    createSupabaseRealtimeToken({
      sessionId: "session-1",
      jwtSecret: "",
    }),
  ).toThrow("SUPABASE_JWT_SECRET is required")
})
