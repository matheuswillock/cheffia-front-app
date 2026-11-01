export type ReactivateSubscriptionInput = {
  tenantId: string
  restaurantId: string
}

export type ReactivateSubscriptionRepository = {
  findSubscription(
    tenantId: string,
    restaurantId: string
  ): Promise<{ stripeSubscriptionId: string; cancelAtPeriodEnd: boolean; status: string } | null>
  reactivate(stripeSubscriptionId: string): Promise<void>
}

export class ReactivateSubscriptionError extends Error {
  constructor(
    public readonly code: "NO_SUBSCRIPTION" | "NOT_SCHEDULED_FOR_CANCEL" | "REACTIVATE_FAILED",
    message?: string
  ) {
    super(message ?? code)
    this.name = "ReactivateSubscriptionError"
  }
}

export async function reactivateSubscription(
  input: ReactivateSubscriptionInput,
  repository: ReactivateSubscriptionRepository
): Promise<void> {
  const subscription = await repository.findSubscription(input.tenantId, input.restaurantId)

  if (!subscription) {
    throw new ReactivateSubscriptionError("NO_SUBSCRIPTION")
  }

  if (!subscription.cancelAtPeriodEnd) {
    throw new ReactivateSubscriptionError("NOT_SCHEDULED_FOR_CANCEL")
  }

  try {
    await repository.reactivate(subscription.stripeSubscriptionId)
  } catch (error) {
    if (error instanceof ReactivateSubscriptionError) throw error
    throw new ReactivateSubscriptionError("REACTIVATE_FAILED")
  }
}
