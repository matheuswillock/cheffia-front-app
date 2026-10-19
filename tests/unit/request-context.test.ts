import { expect, test } from "bun:test"

import { getRequestId } from "@/server/ordering/requestContext"

test("preserves a bounded caller request id and generates one when absent", () => {
  expect(getRequestId(new Headers({ "X-Request-Id": "order-123" }))).toBe("order-123")
  const generated = getRequestId(new Headers())
  expect(generated).toMatch(/^[0-9a-f-]{36}$/)
})

test("does not accept unsafe or oversized request ids", () => {
  expect(getRequestId(new Headers({ "X-Request-Id": "bad value" }))).not.toBe("bad value")
  expect(getRequestId(new Headers({ "X-Request-Id": "x".repeat(129) }))).not.toBe("x".repeat(129))
})
