import { expect, test } from "@playwright/test"

test("homepage exposes the primary application content", async ({ page }) => {
  await page.goto("/")

  await expect(page.locator("main")).toBeVisible()
})
