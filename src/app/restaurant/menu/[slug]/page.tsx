import { PublicOrderingFlow } from "@/components/Ordering/PublicOrderingFlow"

export const dynamic = "force-dynamic"

export default async function MenuPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return <PublicOrderingFlow restaurantSlug={slug} />
}
