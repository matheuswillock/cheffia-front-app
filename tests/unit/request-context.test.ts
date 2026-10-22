import { expect, test } from "bun:test"

import {
  getRequestId,
  jsonWithRequestId,
  redirectWithRequestId,
  withRequestId,
} from "@/server/ordering/requestContext"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

test("preserves a bounded caller request id and generates one when absent", () => {
  expect(getRequestId(new Headers({ "X-Request-Id": "order-123" }))).toBe("order-123")
  expect(getRequestId(new Headers())).toMatch(uuidPattern)
})

test("replaces unsafe or oversized request ids with a generated UUID", () => {
  expect(getRequestId(new Headers({ "X-Request-Id": "bad value" }))).toMatch(uuidPattern)
  expect(getRequestId(new Headers({ "X-Request-Id": "x".repeat(129) }))).toMatch(uuidPattern)
  expect(getRequestId(new Headers({ "X-Request-Id": "x".repeat(128) }))).toBe("x".repeat(128))
})

test("jsonWithRequestId echoes the caller id and keeps the existing status and headers", () => {
  const request = new Request("http://localhost/api/x", { headers: { "X-Request-Id": "trace-1" } })
  const response = jsonWithRequestId(request, { ok: true }, {
    status: 201,
    headers: { "Cache-Control": "no-store", "Idempotency-Key": "key-1" },
  })

  expect(response.status).toBe(201)
  expect(response.headers.get("X-Request-Id")).toBe("trace-1")
  expect(response.headers.get("Cache-Control")).toBe("no-store")
  expect(response.headers.get("Idempotency-Key")).toBe("key-1")
})

test("redirectWithRequestId keeps the 307 location contract and carries the id", () => {
  const request = new Request("http://localhost/api/x", { headers: { "X-Request-Id": "trace-2" } })
  const response = redirectWithRequestId(request, "/unauthorized")

  expect(response.status).toBe(307)
  expect(response.headers.get("Location")).toBe("/unauthorized")
  expect(response.headers.get("X-Request-Id")).toBe("trace-2")
})

test("withRequestId adds the header to an existing response without changing it", () => {
  const request = new Request("http://localhost/table/x", { headers: { "X-Request-Id": "trace-3" } })
  const response = withRequestId(request, new Response(null, { status: 307, headers: { Location: "/error" } }))

  expect(response.status).toBe(307)
  expect(response.headers.get("Location")).toBe("/error")
  expect(response.headers.get("X-Request-Id")).toBe("trace-3")
})
