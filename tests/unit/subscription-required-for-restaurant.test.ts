// T12 — Conta sem assinatura confirmada não cria restaurante operacional
import { expect, test, describe, mock } from "bun:test"
import {
  getRestaurantPlan,
  requiresPlan,
  type PlanGateRepository,
} from "@/business/billing/getRestaurantPlan"

function makeRepoWithNoSubscription(): PlanGateRepository {
  return {
    findActiveSubscription: mock(async () => null),
  }
}

describe("T12 — subscription required for operational restaurant", () => {
  test("restaurant without subscription is denied access", async () => {
    const result = await getRestaurantPlan("tenant-1", "restaurant-1", makeRepoWithNoSubscription())
    expect(result.allowed).toBe(false)
  })

  test("denial reason is NO_SUBSCRIPTION", async () => {
    const result = await getRestaurantPlan("tenant-1", "restaurant-1", makeRepoWithNoSubscription())
    if (!result.allowed) {
      expect(result.reason).toBe("NO_SUBSCRIPTION")
    }
  })

  test("requiresPlan is never meaningful without a subscription", async () => {
    // Without a subscription there is no plan to compare — the gate blocks before requiresPlan is called.
    // Verify the denied result carries no plan field.
    const result = await getRestaurantPlan("tenant-1", "restaurant-1", makeRepoWithNoSubscription())
    expect(result.allowed).toBe(false)
    expect("plan" in result).toBe(false)
  })

  test("requiresPlan itself: no plan satisfies a requirement without data", () => {
    // Even if somehow called with mismatched plans, hierarchy is enforced correctly.
    expect(requiresPlan("basic", "basic")).toBe(true)
    expect(requiresPlan("pro", "basic")).toBe(false)
    expect(requiresPlan("complete", "basic")).toBe(false)
  })

  test("restaurant without subscription cannot access basic operations", async () => {
    // Simulates a basic-gated operation (e.g. table creation, kitchen orders)
    const result = await getRestaurantPlan("tenant-1", "restaurant-1", makeRepoWithNoSubscription())
    const canAccessBasicFeatures = result.allowed && requiresPlan("basic", result.plan)
    expect(canAccessBasicFeatures).toBe(false)
  })

  test("restaurant without subscription cannot access pro operations", async () => {
    const result = await getRestaurantPlan("tenant-1", "restaurant-1", makeRepoWithNoSubscription())
    const canAccessProFeatures = result.allowed && requiresPlan("pro", result.plan)
    expect(canAccessProFeatures).toBe(false)
  })

  test("passes correct identifiers to the repository", async () => {
    const repo = makeRepoWithNoSubscription()
    await getRestaurantPlan("tenant-abc", "restaurant-xyz", repo)
    expect(repo.findActiveSubscription).toHaveBeenCalledWith("tenant-abc", "restaurant-xyz")
  })
})
