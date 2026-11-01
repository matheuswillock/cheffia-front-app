import { expect, test, describe, mock } from "bun:test"
import {
  reactivateSubscription,
  ReactivateSubscriptionError,
  type ReactivateSubscriptionRepository,
} from "@/business/billing/reactivateSubscription"

const BASE_SUB = {
  stripeSubscriptionId: "sub_test_abc123",
  cancelAtPeriodEnd: true,
  status: "active",
}

function makeRepo(
  overrides: Partial<ReactivateSubscriptionRepository> = {}
): ReactivateSubscriptionRepository {
  return {
    findSubscription: mock(async () => BASE_SUB),
    reactivate: mock(async () => {}),
    ...overrides,
  }
}

const BASE_INPUT = { tenantId: "t1", restaurantId: "r1" }

describe("reactivateSubscription", () => {
  test("calls reactivate with stripeSubscriptionId when cancelAtPeriodEnd is true", async () => {
    const repo = makeRepo()
    await reactivateSubscription(BASE_INPUT, repo)
    expect(repo.reactivate).toHaveBeenCalledWith("sub_test_abc123")
  })

  test("passes tenantId and restaurantId to findSubscription", async () => {
    const repo = makeRepo()
    await reactivateSubscription(BASE_INPUT, repo)
    expect(repo.findSubscription).toHaveBeenCalledWith("t1", "r1")
  })

  test("throws NO_SUBSCRIPTION when findSubscription returns null", async () => {
    const repo = makeRepo({ findSubscription: mock(async () => null) })
    try {
      await reactivateSubscription(BASE_INPUT, repo)
      throw new Error("should have thrown")
    } catch (err) {
      expect(err instanceof ReactivateSubscriptionError).toBe(true)
      expect((err as ReactivateSubscriptionError).code).toBe("NO_SUBSCRIPTION")
    }
  })

  test("throws NOT_SCHEDULED_FOR_CANCEL when cancelAtPeriodEnd is false", async () => {
    const repo = makeRepo({
      findSubscription: mock(async () => ({ ...BASE_SUB, cancelAtPeriodEnd: false })),
    })
    try {
      await reactivateSubscription(BASE_INPUT, repo)
      throw new Error("should have thrown")
    } catch (err) {
      expect(err instanceof ReactivateSubscriptionError).toBe(true)
      expect((err as ReactivateSubscriptionError).code).toBe("NOT_SCHEDULED_FOR_CANCEL")
    }
  })

  test("does not call reactivate when NOT_SCHEDULED_FOR_CANCEL", async () => {
    const reactivate = mock(async () => {})
    const repo = makeRepo({
      findSubscription: mock(async () => ({ ...BASE_SUB, cancelAtPeriodEnd: false })),
      reactivate,
    })
    try { await reactivateSubscription(BASE_INPUT, repo) } catch { /* expected */ }
    expect(reactivate).not.toHaveBeenCalled()
  })

  test("throws REACTIVATE_FAILED when reactivate throws unexpectedly", async () => {
    const repo = makeRepo({
      reactivate: mock(async () => { throw new Error("stripe error") }),
    })
    try {
      await reactivateSubscription(BASE_INPUT, repo)
      throw new Error("should have thrown")
    } catch (err) {
      expect(err instanceof ReactivateSubscriptionError).toBe(true)
      expect((err as ReactivateSubscriptionError).code).toBe("REACTIVATE_FAILED")
    }
  })
})
