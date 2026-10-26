import { expect, test } from "bun:test"

test("maps supported source branches to the canonical promotion targets", async () => {
  const moduleUrl = new URL("../../scripts/ci/open-promotion-pr.mjs", import.meta.url)
  expect(await Bun.file(moduleUrl).exists()).toBe(true)
  if (!(await Bun.file(moduleUrl).exists())) return
  const { promotionTarget } = await import("../../scripts/ci/open-promotion-pr.mjs")

  expect(promotionTarget("feature/order-flow")).toBe("develop")
  expect(promotionTarget("bugfix/order-race")).toBe("develop")
  expect(promotionTarget("develop")).toBe("release")
  expect(promotionTarget("release")).toBe("main")
  expect(promotionTarget("main")).toBeNull()
})

test("updates only the managed marker block and remains idempotent", async () => {
  const moduleUrl = new URL("../../scripts/ci/open-promotion-pr.mjs", import.meta.url)
  if (!(await Bun.file(moduleUrl).exists())) return
  const { upsertManagedPromotionBody } = await import("../../scripts/ci/open-promotion-pr.mjs")
  const oldBlock = "<!-- cheffia-promotion:start -->\nold generated text\n<!-- cheffia-promotion:end -->"
  const newBlock = "<!-- cheffia-promotion:start -->\nnew generated text\n<!-- cheffia-promotion:end -->"
  const body = `Human notes\n\n${oldBlock}`

  const updated = upsertManagedPromotionBody(body, newBlock)
  expect(updated).toBe(`Human notes\n\n${newBlock}`)
  expect(upsertManagedPromotionBody(updated, newBlock)).toBe(updated)
})
