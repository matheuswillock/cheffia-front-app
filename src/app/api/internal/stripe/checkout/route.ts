import { requireRouteSession } from "@/server/auth/routeSession"
import { jsonWithRequestId } from "@/server/ordering/requestContext"
import { createCheckoutSession, CheckoutSessionError, isSamePlanCycle } from "@/business/billing/createCheckoutSession"
import { createCheckoutRepository } from "@/server/billing/checkoutRepository"
import { getPrismaClient } from "@/server/infra/prisma/client"
import type { BillingCycle, SubscriptionPlan } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

// upgrade/downgrade: envie o novo plan+billingCycle; o Stripe aplica prorate automaticamente
const VALID_PLANS = new Set<SubscriptionPlan>(["basic", "pro", "complete"])
const VALID_CYCLES = new Set<BillingCycle>(["monthly", "quarterly", "semiannual", "annual"])

export async function POST(request: Request) {
  const session = await requireRouteSession(request)
  if (!session.ok) return session.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonWithRequestId(request, { code: "INVALID_JSON" }, { status: 400 })
  }

  const { plan, billingCycle, restaurantId, tenantId, paymentMethod } = body as Record<string, unknown>

  if (typeof plan !== "string" || !VALID_PLANS.has(plan as SubscriptionPlan)) {
    return jsonWithRequestId(request, { code: "INVALID_PLAN" }, { status: 400 })
  }
  if (typeof billingCycle !== "string" || !VALID_CYCLES.has(billingCycle as BillingCycle)) {
    return jsonWithRequestId(request, { code: "INVALID_BILLING_CYCLE" }, { status: 400 })
  }
  if (typeof restaurantId !== "string" || !restaurantId) {
    return jsonWithRequestId(request, { code: "RESTAURANT_ID_REQUIRED" }, { status: 400 })
  }
  if (typeof tenantId !== "string" || !tenantId) {
    return jsonWithRequestId(request, { code: "TENANT_ID_REQUIRED" }, { status: 400 })
  }

  // Verify the authenticated user belongs to this restaurant with owner/manager role
  const db = getPrismaClient()
  const membership = await db.restaurantMembership.findFirst({
    where: {
      tenantId,
      restaurantId,
      userId: session.user.id,
      status: "active",
      role: { in: ["owner", "manager"] },
    },
    select: { role: true },
  })

  if (!membership) {
    return jsonWithRequestId(request, { code: "FORBIDDEN" }, { status: 403 })
  }

  // Para upgrade/downgrade, envie o novo plan+billingCycle; o Stripe aplica prorate via subscription existente.
  const existingSub = await db.subscription.findUnique({
    where: { tenantId_restaurantId: { tenantId, restaurantId } },
    select: { plan: true, billingCycle: true, status: true, stripeSubscriptionId: true },
  })
  if (isSamePlanCycle(existingSub, { plan: plan as SubscriptionPlan, billingCycle: billingCycle as BillingCycle })) {
    return jsonWithRequestId(request, { code: "SAME_PLAN_CYCLE" }, { status: 409 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const isPixPayment = paymentMethod === "pix"
  const isUpgradeDowngrade =
    !isPixPayment &&
    existingSub != null &&
    ["active", "past_due"].includes(existingSub.status) &&
    typeof existingSub.stripeSubscriptionId === "string"

  try {
    const result = await createCheckoutSession(
      {
        tenantId,
        restaurantId,
        plan: plan as SubscriptionPlan,
        billingCycle: billingCycle as BillingCycle,
        userEmail: session.user.email ?? "",
        successUrl: `${appUrl}/restaurant/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${appUrl}/restaurant/subscription`,
        existingStripeSubscriptionId: isUpgradeDowngrade
          ? (existingSub.stripeSubscriptionId as string)
          : undefined,
        paymentMethod: isPixPayment ? "pix" : "card",
      },
      createCheckoutRepository()
    )

    return jsonWithRequestId(request, { url: result.url }, { status: 200 })
  } catch (error) {
    if (error instanceof CheckoutSessionError) {
      return jsonWithRequestId(request, { code: error.code }, { status: 400 })
    }
    console.error("[stripe/checkout] session creation failed:", error)
    return jsonWithRequestId(request, { code: "CHECKOUT_UNAVAILABLE" }, { status: 503 })
  }
}
