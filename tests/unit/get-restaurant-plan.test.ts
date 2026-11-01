import { expect, test, describe, mock } from "bun:test"
import {
  getRestaurantPlan,
  requiresPlan,
  PLAN_HIERARCHY,
  type PlanGateRepository,
  type PlanInfo,
} from "@/business/billing/getRestaurantPlan"

const BASE_SUB: PlanInfo = {
  plan: "pro",
  status: "active",
  cancelAtPeriodEnd: false,
  currentPeriodEnd: new Date("2027-01-01"),
}

function makeRepo(sub: PlanInfo | null = BASE_SUB): PlanGateRepository {
  return {
    findActiveSubscription: mock(async () => sub),
  }
}

describe("requiresPlan", () => {
  test("basic satisfies basic", () => expect(requiresPlan("basic", "basic")).toBe(true))
  test("pro satisfies basic", () => expect(requiresPlan("basic", "pro")).toBe(true))
  test("complete satisfies pro", () => expect(requiresPlan("pro", "complete")).toBe(true))
  test("basic does NOT satisfy pro", () => expect(requiresPlan("pro", "basic")).toBe(false))
  test("pro does NOT satisfy complete", () => expect(requiresPlan("complete", "pro")).toBe(false))
  test("basic does NOT satisfy complete", () => expect(requiresPlan("complete", "basic")).toBe(false))
})

describe("PLAN_HIERARCHY", () => {
  test("basic < pro < complete", () => {
    expect(PLAN_HIERARCHY.basic).toBeLessThan(PLAN_HIERARCHY.pro)
    expect(PLAN_HIERARCHY.pro).toBeLessThan(PLAN_HIERARCHY.complete)
  })
})

describe("getRestaurantPlan", () => {
  test("returns allowed with plan when active subscription exists", async () => {
    const result = await getRestaurantPlan("t1", "r1", makeRepo())
    expect(result.allowed).toBe(true)
    if (result.allowed) {
      expect(result.plan).toBe("pro")
      expect(result.status).toBe("active")
    }
  })

  test("returns NO_SUBSCRIPTION when no subscription found", async () => {
    const result = await getRestaurantPlan("t1", "r1", makeRepo(null))
    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.reason).toBe("NO_SUBSCRIPTION")
  })

  test("past_due subscription is allowed (grace period)", async () => {
    const result = await getRestaurantPlan("t1", "r1", makeRepo({ ...BASE_SUB, status: "past_due" }))
    expect(result.allowed).toBe(true)
  })

  test("canceled subscription returns SUBSCRIPTION_INACTIVE", async () => {
    const result = await getRestaurantPlan("t1", "r1", makeRepo({ ...BASE_SUB, status: "canceled" }))
    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.reason).toBe("SUBSCRIPTION_INACTIVE")
  })

  test("incomplete subscription returns SUBSCRIPTION_INACTIVE", async () => {
    const result = await getRestaurantPlan("t1", "r1", makeRepo({ ...BASE_SUB, status: "incomplete" }))
    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.reason).toBe("SUBSCRIPTION_INACTIVE")
  })

  test("passes tenantId and restaurantId to repository", async () => {
    const repo = makeRepo()
    await getRestaurantPlan("tenant-abc", "restaurant-xyz", repo)
    expect(repo.findActiveSubscription).toHaveBeenCalledWith("tenant-abc", "restaurant-xyz")
  })

  test("basic plan user is allowed", async () => {
    const result = await getRestaurantPlan("t1", "r1", makeRepo({ ...BASE_SUB, plan: "basic" }))
    expect(result.allowed).toBe(true)
    if (result.allowed) expect(result.plan).toBe("basic")
  })

  test("complete plan user is allowed", async () => {
    const result = await getRestaurantPlan("t1", "r1", makeRepo({ ...BASE_SUB, plan: "complete" }))
    expect(result.allowed).toBe(true)
    if (result.allowed) expect(result.plan).toBe("complete")
  })
})
