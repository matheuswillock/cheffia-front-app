import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type pg from "pg"

import { getRestaurantPlanFromDb } from "@/server/billing/planGate"
import { requiresPlan } from "@/business/billing/getRestaurantPlan"

import { createFixture, createSubscription, createTestPool, createTestPrisma } from "./support/database"

const prisma = createTestPrisma()
let pool: pg.Pool

beforeAll(async () => {
  pool = await createTestPool()
})

afterAll(async () => {
  await prisma.$disconnect()
  await pool.end()
})

describe("getRestaurantPlanFromDb", () => {
  test("returns NO_SUBSCRIPTION when restaurant has no subscription", async () => {
    const fixture = await createFixture(pool)
    const result = await getRestaurantPlanFromDb(fixture.tenantId, fixture.restaurantId)
    expect(result).toEqual({ allowed: false, reason: "NO_SUBSCRIPTION" })
  })

  test("returns allowed with plan and status for active basic subscription", async () => {
    const fixture = await createFixture(pool)
    await createSubscription(pool, fixture, { plan: "basic", status: "active" })
    const result = await getRestaurantPlanFromDb(fixture.tenantId, fixture.restaurantId)
    expect(result).toMatchObject({ allowed: true, plan: "basic", status: "active" })
  })

  test("returns allowed for active pro subscription", async () => {
    const fixture = await createFixture(pool)
    await createSubscription(pool, fixture, { plan: "pro", status: "active" })
    const result = await getRestaurantPlanFromDb(fixture.tenantId, fixture.restaurantId)
    expect(result).toMatchObject({ allowed: true, plan: "pro" })
  })

  test("returns allowed for past_due subscription (grace period)", async () => {
    const fixture = await createFixture(pool)
    await createSubscription(pool, fixture, { plan: "basic", status: "past_due" })
    const result = await getRestaurantPlanFromDb(fixture.tenantId, fixture.restaurantId)
    expect(result).toMatchObject({ allowed: true })
  })

  test("returns SUBSCRIPTION_INACTIVE for canceled subscription", async () => {
    const fixture = await createFixture(pool)
    await createSubscription(pool, fixture, { plan: "basic", status: "canceled" })
    const result = await getRestaurantPlanFromDb(fixture.tenantId, fixture.restaurantId)
    expect(result).toEqual({ allowed: false, reason: "SUBSCRIPTION_INACTIVE" })
  })

  test("returns SUBSCRIPTION_INACTIVE for incomplete subscription", async () => {
    const fixture = await createFixture(pool)
    await createSubscription(pool, fixture, { plan: "pro", status: "incomplete" })
    const result = await getRestaurantPlanFromDb(fixture.tenantId, fixture.restaurantId)
    expect(result).toEqual({ allowed: false, reason: "SUBSCRIPTION_INACTIVE" })
  })
})

describe("requiresPlan — plan hierarchy checks", () => {
  test("basic does not satisfy pro gate", () => {
    expect(requiresPlan("pro", "basic")).toBe(false)
  })

  test("pro satisfies basic gate", () => {
    expect(requiresPlan("basic", "pro")).toBe(true)
  })

  test("complete satisfies all gates", () => {
    expect(requiresPlan("basic", "complete")).toBe(true)
    expect(requiresPlan("pro", "complete")).toBe(true)
    expect(requiresPlan("complete", "complete")).toBe(true)
  })

  test("basic does not satisfy complete gate", () => {
    expect(requiresPlan("complete", "basic")).toBe(false)
  })
})
