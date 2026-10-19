import { TableManager } from "@/components/Ordering/TableManager"

export const dynamic = "force-dynamic"

export default async function QRCodeGeneratorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return <TableManager restaurantSlug={slug} />
}
