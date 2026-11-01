import Stripe from "stripe"
import { getStripeClient } from "@/server/infra/stripe/client"
import { getPrismaClient } from "@/server/infra/prisma/client"
import { createSubscriptionRepository } from "@/server/billing/subscriptionRepository"
import { resolvePriceId } from "@/server/infra/stripe/prices"
import type { SubscriptionStatus } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

// Stripe sends the raw body; Next.js must not parse it before signature verification.
export const config = { api: { bodyParser: false } }

const HANDLED_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
])

function stripeStatusToPrisma(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":            return "active"
    case "past_due":          return "past_due"
    case "canceled":          return "canceled"
    case "incomplete":        return "incomplete"
    case "incomplete_expired":return "incomplete_expired"
    case "unpaid":            return "unpaid"
    // trialing / paused not in our enum — treat as active
    default:                  return "active"
  }
}

async function handleSubscriptionEvent(
  subscription: Stripe.Subscription,
  isDeleted: boolean
) {
  const repo = createSubscriptionRepository(getPrismaClient())

  if (isDeleted) {
    await repo.cancelByStripeSubscriptionId(subscription.id)
    return
  }

  const item = subscription.items.data[0]
  if (!item) {
    console.error(`[stripe/webhook] subscription ${subscription.id} has no price item`)
    return
  }

  const priceId = item.price.id
  const resolved = resolvePriceId(priceId)
  if (!resolved) {
    console.error(`[stripe/webhook] unknown price ID: ${priceId} on subscription ${subscription.id}`)
    return
  }

  const tenantId = subscription.metadata?.tenant_id
  const restaurantId = subscription.metadata?.restaurant_id

  if (!tenantId || !restaurantId) {
    console.error(
      `[stripe/webhook] subscription ${subscription.id} missing tenant_id or restaurant_id in metadata`
    )
    return
  }

  await repo.upsertByStripeSubscriptionId({
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    stripePriceId: priceId,
    plan: resolved.plan,
    billingCycle: resolved.billingCycle,
    status: stripeStatusToPrisma(subscription.status),
    // current_period_start/end live on the SubscriptionItem in the current Stripe API
    currentPeriodStart: new Date(item.current_period_start * 1000),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    tenantId,
    restaurantId,
  })
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // In the current Stripe API, the subscription reference lives under invoice.parent
  const subscriptionRef = invoice.parent?.subscription_details?.subscription
  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id

  if (!subscriptionId) return

  // Re-read the subscription to get current status (may already be past_due)
  const stripe = getStripeClient()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await handleSubscriptionEvent(subscription, false)
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set")
    return new Response("Webhook secret not configured", { status: 500 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 })
  }

  const rawBody = await request.arrayBuffer()
  const payload = Buffer.from(rawBody)

  let event: Stripe.Event
  try {
    event = getStripeClient().webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error(`[stripe/webhook] signature verification failed: ${message}`)
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 })
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return new Response("Event type not handled", { status: 200 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription, false)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription, true)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
    }
  } catch (err) {
    console.error(`[stripe/webhook] error handling event ${event.type}:`, err)
    // Return 500 so Stripe retries the event
    return new Response("Internal error processing webhook", { status: 500 })
  }

  return new Response(null, { status: 200 })
}
