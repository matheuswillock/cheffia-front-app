"use client"

import { useCallback, useEffect, useState } from "react"
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js"

import type { OrderStatus } from "@/business/order/orderState"
import { createClient as createSupabaseClient } from "@/utils/supabase/client"

type KitchenOrder = {
  orderId: string
  status: OrderStatus
  tableLabel: string
  createdAt: string
  updatedAt: string
  items: Array<{ name: string; quantity: number; note: string | null }>
}

const labels: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  delivered: "Entregue",
  rejected: "Recusado",
  cancelled: "Cancelado",
}

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "delivered",
}

export function KitchenOrderHub({ restaurantSlug }: { restaurantSlug: string }) {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transitioning, setTransitioning] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/restaurants/${encodeURIComponent(restaurantSlug)}/orders`, {
        cache: "no-store",
      })
      if (!response.ok) throw new Error("KITCHEN_ORDERS_UNAVAILABLE")
      const id = response.headers.get("X-Restaurant-Id")
      if (id) setRestaurantId(id)
      setOrders((await response.json()) as KitchenOrder[])
      setError(null)
    } catch {
      setError("Não foi possível carregar a fila da cozinha.")
    } finally {
      setLoading(false)
    }
  }, [restaurantSlug])

  useEffect(() => {
    void loadOrders()
    const interval = window.setInterval(() => void loadOrders(), 10000)
    return () => window.clearInterval(interval)
  }, [loadOrders])

  useEffect(() => {
    if (!restaurantId) return
    let disposed = false
    let channel: RealtimeChannel | null = null
    const seen = new Set<string>()
    let client: SupabaseClient | null = null
    void createSupabaseClient().then((resolved) => {
      if (disposed) return
      client = resolved
      channel = resolved
        .channel(`restaurant:${restaurantId}:orders`, { config: { private: true } })
        .on("broadcast", { event: "order.updated" }, (message) => {
          const event = message.payload as { eventId?: unknown }
          if (typeof event.eventId !== "string" || seen.has(event.eventId)) return
          seen.add(event.eventId)
          void loadOrders()
        })
        .subscribe((status) => { if (status === "SUBSCRIBED") void loadOrders() })
    })
    return () => { disposed = true; if (client && channel) void client.removeChannel(channel) }
  }, [restaurantId, loadOrders])

  const advance = async (order: KitchenOrder, target = nextStatus[order.status], reason?: string) => {
    if (!target) return

    setTransitioning(order.orderId)
    setError(null)
    try {
      const response = await fetch(
        `/api/restaurants/${encodeURIComponent(restaurantSlug)}/orders/${encodeURIComponent(order.orderId)}/transitions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify({ status: target, reason }),
        },
      )
      if (!response.ok) throw new Error("ORDER_TRANSITION_FAILED")
      const result = (await response.json()) as { status: OrderStatus }
      setOrders((current) =>
        result.status === "delivered" || result.status === "rejected"
          ? current.filter((item) => item.orderId !== order.orderId)
          : current.map((item) => (item.orderId === order.orderId ? { ...item, status: result.status } : item)),
      )
    } catch {
      setError("O pedido mudou antes da atualização. Recarregue a fila.")
    } finally {
      setTransitioning(null)
    }
  }

  if (loading) return <p role="status">Carregando fila da cozinha…</p>

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Fila da cozinha</h1>
        <button type="button" className="rounded-lg border px-3 py-2" onClick={() => void loadOrders()}>
          Atualizar
        </button>
      </div>
      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      {!orders.length ? (
        <p className="rounded-xl border p-6 text-muted-foreground">Nenhum pedido ativo.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <article key={order.orderId} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{order.tableLabel}</h2>
                  <p className="text-xs text-muted-foreground">Pedido {order.orderId}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs" aria-label={`Status ${labels[order.status]}`}>
                  {labels[order.status]}
                </span>
              </div>
              <ul className="my-4 space-y-2 text-sm">
                {order.items.map((item, index) => (
                  <li key={`${order.orderId}-${index}`}>
                    <strong>{item.quantity}×</strong> {item.name}
                    {item.note && <span className="block text-xs text-muted-foreground">Obs.: {item.note}</span>}
                  </li>
                ))}
              </ul>
              {nextStatus[order.status] && (
                <button
                  type="button"
                  className="w-full rounded-lg bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
                  disabled={transitioning === order.orderId}
                  onClick={() => void advance(order)}
                  aria-label={`${actionLabel(order.status)} pedido ${order.orderId}`}
                >
                  {transitioning === order.orderId ? "Atualizando…" : actionLabel(order.status)}
                </button>
              )}
              {(order.status === "pending" || order.status === "confirmed") && (
                <button type="button" className="mt-2 w-full rounded-lg border px-3 py-2" onClick={() => { setRejecting(order.orderId); setRejectReason("") }}>
                  Recusar pedido
                </button>
              )}
              {rejecting === order.orderId && (
                <form className="mt-3 space-y-2" onSubmit={(event) => {
                  event.preventDefault()
                  if (!rejectReason.trim()) return
                  setRejecting(null)
                  void advance(order, "rejected", rejectReason)
                }}>
                  <label htmlFor={`reject-${order.orderId}`} className="text-sm font-medium">Motivo da recusa</label>
                  <input id={`reject-${order.orderId}`} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} required className="w-full rounded border px-2 py-1" />
                  <button type="submit" className="rounded bg-destructive px-3 py-2 text-destructive-foreground">Confirmar recusa</button>
                </form>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

function actionLabel(status: OrderStatus) {
  return status === "pending" ? "Confirmar" : status === "confirmed" ? "Iniciar preparo" : status === "preparing" ? "Marcar pronto" : "Marcar entregue"
}
