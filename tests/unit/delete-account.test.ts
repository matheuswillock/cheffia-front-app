import { expect, test, describe, mock, spyOn } from "bun:test"
import { deleteAccount, DeleteAccountError, type DeleteAccountRepository } from "@/business/billing/deleteAccount"

const INPUT = { tenantId: "tenant-1", restaurantId: "restaurant-1" }

function makeRepo(overrides: Partial<DeleteAccountRepository> = {}): DeleteAccountRepository {
  return {
    findStripeSubscriptionId: mock(async () => "sub_test_123"),
    cancelStripeSubscription: mock(async () => {}),
    deactivateRestaurant: mock(async () => {}),
    ...overrides,
  }
}

describe("deleteAccount", () => {
  test("cancels stripe subscription and deactivates restaurant when subscription exists", async () => {
    const repo = makeRepo()
    await deleteAccount(INPUT, repo)
    expect(repo.cancelStripeSubscription).toHaveBeenCalledWith("sub_test_123")
    expect(repo.deactivateRestaurant).toHaveBeenCalledWith("tenant-1", "restaurant-1")
  })

  test("deactivates restaurant even when no subscription exists", async () => {
    const repo = makeRepo({ findStripeSubscriptionId: mock(async () => null) })
    await deleteAccount(INPUT, repo)
    expect(repo.cancelStripeSubscription).not.toHaveBeenCalled()
    expect(repo.deactivateRestaurant).toHaveBeenCalledWith("tenant-1", "restaurant-1")
  })

  test("stripe error does not block deactivation (best-effort)", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {})
    const repo = makeRepo({
      cancelStripeSubscription: mock(async () => { throw new Error("Stripe unavailable") }),
    })
    await expect(deleteAccount(INPUT, repo)).resolves.toBeUndefined()
    expect(repo.deactivateRestaurant).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  test("throws DeleteAccountError when deactivateRestaurant fails", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {})
    const repo = makeRepo({
      deactivateRestaurant: mock(async () => { throw new Error("DB error") }),
    })
    await expect(deleteAccount(INPUT, repo)).rejects.toThrow(DeleteAccountError)
    try {
      await deleteAccount(INPUT, repo)
    } catch (err) {
      expect(err instanceof DeleteAccountError).toBe(true)
      expect((err as DeleteAccountError).code).toBe("DEACTIVATE_FAILED")
    }
    consoleSpy.mockRestore()
  })

  test("passes tenantId and restaurantId to all repository methods", async () => {
    const repo = makeRepo()
    await deleteAccount(INPUT, repo)
    expect(repo.findStripeSubscriptionId).toHaveBeenCalledWith("tenant-1", "restaurant-1")
    expect(repo.deactivateRestaurant).toHaveBeenCalledWith("tenant-1", "restaurant-1")
  })
})
