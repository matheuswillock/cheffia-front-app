import { expect, test } from "@playwright/test"

test("homepage exposes the primary application content", async ({ page }) => {
  await page.goto("/")

  await expect(page.locator("main")).toBeVisible()
})

test("public ordering APIs reject requests without table/session context", async ({ request }) => {
  const menuResponse = await request.get("/api/public/restaurants/demo/menu")
  expect(menuResponse.status()).toBe(401)
  expect(menuResponse.headers()["x-request-id"]).toMatch(/^[A-Za-z0-9._:-]+$/)
  await expect(menuResponse.json()).resolves.toMatchObject({ code: "MENU_SESSION_REQUIRED" })

  const orderResponse = await request.post("/api/public/orders", {
    data: { items: [] },
  })
  expect(orderResponse.status()).toBe(400)
  expect(orderResponse.headers()["x-request-id"]).toMatch(/^[A-Za-z0-9._:-]+$/)
  await expect(orderResponse.json()).resolves.toMatchObject({ code: "IDEMPOTENCY_KEY_REQUIRED" })
})
