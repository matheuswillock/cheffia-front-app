export type DeleteAccountInput = {
  tenantId: string
  restaurantId: string
}

export type DeleteAccountRepository = {
  findStripeSubscriptionId(tenantId: string, restaurantId: string): Promise<string | null>
  cancelStripeSubscription(stripeSubscriptionId: string): Promise<void>
  deactivateRestaurant(tenantId: string, restaurantId: string): Promise<void>
}

export class DeleteAccountError extends Error {
  constructor(public readonly code: "DEACTIVATE_FAILED", message?: string) {
    super(message ?? code)
    this.name = "DeleteAccountError"
  }
}

export async function deleteAccount(
  input: DeleteAccountInput,
  repository: DeleteAccountRepository
): Promise<void> {
  const stripeSubscriptionId = await repository.findStripeSubscriptionId(input.tenantId, input.restaurantId)

  if (stripeSubscriptionId) {
    try {
      await repository.cancelStripeSubscription(stripeSubscriptionId)
    } catch (err) {
      console.error("[deleteAccount] Stripe cancellation failed (best-effort):", err)
    }
  }

  try {
    await repository.deactivateRestaurant(input.tenantId, input.restaurantId)
  } catch (err) {
    throw new DeleteAccountError("DEACTIVATE_FAILED", err instanceof Error ? err.message : undefined)
  }
}
