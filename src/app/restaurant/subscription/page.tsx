import { SubscriptionManager } from "@/components/Billing/SubscriptionManager"

export const dynamic = "force-dynamic"

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; restaurantId?: string; slug?: string }>
}) {
  const { tenantId, restaurantId, slug } = await searchParams

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Assinatura</h1>
      <SubscriptionManager
        restaurantSlug={slug ?? ""}
        tenantId={tenantId ?? ""}
        restaurantId={restaurantId ?? ""}
      />
    </main>
  )
}
