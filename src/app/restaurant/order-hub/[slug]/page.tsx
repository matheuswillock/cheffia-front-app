import { KitchenOrderHub } from "@/components/Ordering/KitchenOrderHub"

export const dynamic = "force-dynamic"

export default async function OrderHubPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return <KitchenOrderHub restaurantSlug={slug} />
}
