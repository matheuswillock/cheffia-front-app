import { expect, test } from "@playwright/test"

const callerRequestId = "e2e-request-id-1"
const unknownOrderId = "00000000-0000-4000-8000-000000000000"
const unknownToken = "v1.invalid.invalid"

type Case = {
  name: string
  method: "GET" | "POST"
  path: string
  data?: unknown
  maxRedirects?: number
  // Pins the existing contract of the error branch that answers without a database.
  expectedStatus?: number
  expectedLocation?: RegExp
}

// Every API route handler, exercised without a session so the error branch answers.
const cases: Case[] = [
  { name: "health", method: "GET", path: "/api/health" },
  { name: "outbox cron without secret", method: "GET", path: "/api/internal/outbox/publish", expectedStatus: 401 },
  { name: "public order without idempotency key", method: "POST", path: "/api/public/orders", data: {}, expectedStatus: 400 },
  { name: "public order status without session", method: "GET", path: `/api/public/orders/${unknownOrderId}`, expectedStatus: 401 },
  { name: "realtime token without session", method: "GET", path: `/api/public/orders/${unknownOrderId}/realtime-token`, expectedStatus: 401 },
  { name: "cancel order without idempotency key", method: "POST", path: `/api/public/orders/${unknownOrderId}/cancel`, expectedStatus: 400 },
  { name: "public menu without session", method: "GET", path: "/api/public/restaurants/e2e-demo/menu", expectedStatus: 401 },
  { name: "table session with unknown token", method: "GET", path: `/api/public/tables/${unknownToken}` },
  {
    name: "kitchen transition without staff session",
    method: "POST",
    path: `/api/restaurants/e2e-demo/orders/${unknownOrderId}/transitions`,
    data: { status: "confirmed" },
    expectedStatus: 307,
    expectedLocation: /\/unauthorized$/,
  },
  {
    name: "kitchen orders without staff session",
    method: "GET",
    path: "/api/restaurants/e2e-demo/orders",
    expectedStatus: 307,
    expectedLocation: /\/unauthorized$/,
  },
  {
    name: "table creation without staff session",
    method: "POST",
    path: "/api/restaurants/e2e-demo/tables",
    data: { label: "Mesa" },
    expectedStatus: 307,
    expectedLocation: /\/unauthorized$/,
  },
  {
    name: "table QR landing with unknown token",
    method: "GET",
    path: `/table/${unknownToken}`,
    maxRedirects: 0,
    expectedStatus: 307,
    expectedLocation: /\/error$/,
  },
]

for (const testCase of cases) {
  test(`${testCase.name} echoes the caller X-Request-Id`, async ({ request }) => {
    const response = await request.fetch(testCase.path, {
      method: testCase.method,
      headers: { "X-Request-Id": callerRequestId },
      data: testCase.data,
      maxRedirects: testCase.maxRedirects ?? 0,
    })

    expect(response.headers()["x-request-id"]).toBe(callerRequestId)
    if (testCase.expectedStatus !== undefined) expect(response.status()).toBe(testCase.expectedStatus)
    if (testCase.expectedLocation) expect(response.headers()["location"]).toMatch(testCase.expectedLocation)
  })
}

test("a malformed caller X-Request-Id is replaced by a generated UUID", async ({ request }) => {
  const response = await request.get("/api/health", { headers: { "X-Request-Id": "bad value with spaces" } })

  expect(response.headers()["x-request-id"]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
})
