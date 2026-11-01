import { expect, test, describe, mock } from "bun:test"
import {
  cancelSubscription,
  CancelSubscriptionError,
  type CancelSubscriptionRepository,
} from "@/business/billing/cancelSubscription"

const SUB_ID = "sub_test_abc123"

function makeRepo(
  overrides: Partial<CancelSubscriptionRepository> = {}
): CancelSubscriptionRepository {
  return {
    findStripeSubscriptionId: mock(async () => SUB_ID),
    cancelAtPeriodEnd: mock(async () => {}),
    cancelImmediately: mock(async () => {}),
    ...overrides,
  }
}

const BASE_INPUT = { tenantId: "t1", restaurantId: "r1", immediately: false }

describe("cancelSubscription", () => {
  test("calls cancelAtPeriodEnd when immediately is false", async () => {
    const repo = makeRepo()
    await cancelSubscription(BASE_INPUT, repo)
    expect(repo.cancelAtPeriodEnd).toHaveBeenCalledWith(SUB_ID)
    expect(repo.cancelImmediately).not.toHaveBeenCalled()
  })

  test("calls cancelImmediately when immediately is true", async () => {
    const repo = makeRepo()
    await cancelSubscription({ ...BASE_INPUT, immediately: true }, repo)
    expect(repo.cancelImmediately).toHaveBeenCalledWith(SUB_ID)
    expect(repo.cancelAtPeriodEnd).not.toHaveBeenCalled()
  })

  test("passes tenantId and restaurantId to findStripeSubscriptionId", async () => {
    const repo = makeRepo()
    await cancelSubscription(BASE_INPUT, repo)
    expect(repo.findStripeSubscriptionId).toHaveBeenCalledWith("t1", "r1")
  })

  test("throws NO_SUBSCRIPTION when findStripeSubscriptionId returns null", async () => {
    const repo = makeRepo({ findStripeSubscriptionId: mock(async () => null) })
    try {
      await cancelSubscription(BASE_INPUT, repo)
      throw new Error("should have thrown")
    } catch (err) {
      expect(err instanceof CancelSubscriptionError).toBe(true)
      expect((err as CancelSubscriptionError).code).toBe("NO_SUBSCRIPTION")
    }
  })

  test("does not call cancel when subscription not found", async () => {
    const cancelAtPeriodEnd = mock(async () => {})
    const cancelImmediately = mock(async () => {})
    const repo = makeRepo({
      findStripeSubscriptionId: mock(async () => null),
      cancelAtPeriodEnd,
      cancelImmediately,
    })
    try { await cancelSubscription(BASE_INPUT, repo) } catch { /* expected */ }
    expect(cancelAtPeriodEnd).not.toHaveBeenCalled()
    expect(cancelImmediately).not.toHaveBeenCalled()
  })

  test("throws CANCEL_FAILED when cancelAtPeriodEnd throws unexpectedly", async () => {
    const repo = makeRepo({
      cancelAtPeriodEnd: mock(async () => { throw new Error("stripe error") }),
    })
    try {
      await cancelSubscription(BASE_INPUT, repo)
      throw new Error("should have thrown")
    } catch (err) {
      expect(err instanceof CancelSubscriptionError).toBe(true)
      expect((err as CancelSubscriptionError).code).toBe("CANCEL_FAILED")
    }
  })
})
