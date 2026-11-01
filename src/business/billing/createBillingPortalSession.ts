export type BillingPortalInput = {
  tenantId: string
  restaurantId: string
  returnUrl: string
}

export type BillingPortalResult = {
  url: string
}

export type BillingPortalRepository = {
  findStripeCustomerId(tenantId: string, restaurantId: string): Promise<string | null>
  createPortalSession(stripeCustomerId: string, returnUrl: string): Promise<{ url: string }>
}

export class BillingPortalError extends Error {
  constructor(
    public readonly code: "NO_SUBSCRIPTION" | "PORTAL_UNAVAILABLE",
    message?: string
  ) {
    super(message ?? code)
    this.name = "BillingPortalError"
  }
}

export async function createBillingPortalSession(
  input: BillingPortalInput,
  repository: BillingPortalRepository
): Promise<BillingPortalResult> {
  const customerId = await repository.findStripeCustomerId(input.tenantId, input.restaurantId)
  if (!customerId) {
    throw new BillingPortalError("NO_SUBSCRIPTION")
  }

  try {
    const session = await repository.createPortalSession(customerId, input.returnUrl)
    return { url: session.url }
  } catch (error) {
    if (error instanceof BillingPortalError) throw error
    throw new BillingPortalError("PORTAL_UNAVAILABLE")
  }
}
