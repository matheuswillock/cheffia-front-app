import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  await searchParams

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="mb-4 text-2xl font-bold">Assinatura ativada!</h1>
      <p className="text-muted-foreground mb-8">
        Seu plano foi ativado com sucesso. Pode levar alguns segundos para sincronizar.
      </p>
      <Link href="/restaurant/subscription" className="underline">
        Ver status da assinatura
      </Link>
    </main>
  )
}
