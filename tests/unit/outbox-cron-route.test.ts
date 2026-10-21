import { expect, test } from "bun:test"

import * as route from "@/app/api/internal/outbox/publish/route"

test("the cron route exports GET (Vercel cron) and POST (manual run)", () => {
  expect(typeof route.GET).toBe("function")
  expect(typeof route.POST).toBe("function")
})

test("the cron route rejects unauthenticated calls before touching the database", async () => {
  const response = await route.GET(new Request("http://localhost/api/internal/outbox/publish"))

  expect(response.status).toBe(401)
})
