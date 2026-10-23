import { expect, test } from "bun:test"

import { createOutboxCronHandler } from "@/server/ordering/outboxCronHandler"

function request(method: string, authorization?: string) {
  return new Request("http://localhost/api/internal/outbox/publish", {
    method,
    headers: authorization ? { authorization } : {},
  })
}

test("serves the Vercel cron GET call with the cron secret", async () => {
  const calls: number[] = []
  const handle = createOutboxCronHandler({
    secret: "cron-secret",
    publish: async () => {
      calls.push(1)
      return { claimed: 2, published: 2, failed: 0 }
    },
  })

  const response = await handle(request("GET", "Bearer cron-secret"))

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ claimed: 2, published: 2, failed: 0 })
  expect(calls).toHaveLength(1)
})

test("keeps accepting POST for manual runs", async () => {
  const handle = createOutboxCronHandler({
    secret: "cron-secret",
    publish: async () => ({ claimed: 0, published: 0, failed: 0 }),
  })

  expect((await handle(request("POST", "Bearer cron-secret"))).status).toBe(200)
})

test("rejects missing, wrong and unconfigured secrets without publishing", async () => {
  let published = false
  const publish = async () => {
    published = true
    return {}
  }

  for (const [secret, header] of [
    ["cron-secret", undefined],
    ["cron-secret", "Bearer wrong-secret"],
    ["cron-secret", "cron-secret"],
    [undefined, "Bearer cron-secret"],
  ] as const) {
    const response = await createOutboxCronHandler({ secret, publish })(request("GET", header))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ code: "UNAUTHORIZED" })
  }

  expect(published).toBe(false)
})

test("maps a publisher failure to a non-leaking 503", async () => {
  const handle = createOutboxCronHandler({
    secret: "cron-secret",
    publish: async () => {
      throw new Error("db password leaked here")
    },
  })

  const response = await handle(request("GET", "Bearer cron-secret"))

  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({ code: "OUTBOX_PUBLISHER_UNAVAILABLE" })
})
