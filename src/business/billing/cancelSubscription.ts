export type CancelSubscriptionInput = {
  tenantId: string
  restaurantId: string
  immediately: boolean
}

export type CancelSubscriptionRepository = {
  findStripeSubscriptionId(tenantId: string, restaurantId: string): Promise<string | null>
  cancelAtPeriodEnd(stripeSubscriptionId: string): Promise<void>
  cancelImmediately(stripeSubscriptionId: string): Promise<void>
}

export class CancelSubscriptionError extends Error {
  constructor(
    public readonly code: "NO_SUBSCRIPTION" | "ALREADY_CANCELED" | "CANCEL_FAILED",
    message?: string
  ) {
    super(message ?? code)
    this.name = "CancelSubscriptionError"
  }
}

export async function cancelSubscription(
  input: CancelSubscriptionInput,
  repository: CancelSubscriptionRepository
): Promise<void> {
  const stripeSubscriptionId = await repository.findStripeSubscriptionId(
    input.tenantId,
    input.restaurantId
  )

  if (!stripeSubscriptionId) {
    throw new CancelSubscriptionError("NO_SUBSCRIPTION")
  }

  try {
    if (input.immediately) {
      await repository.cancelImmediately(stripeSubscriptionId)
    } else {
      await repository.cancelAtPeriodEnd(stripeSubscriptionId)
    }
  } catch (error) {
    if (error instanceof CancelSubscriptionError) throw error
    throw new CancelSubscriptionError("CANCEL_FAILED")
  }
}
