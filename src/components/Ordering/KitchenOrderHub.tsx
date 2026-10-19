"use client"

import { useCallback, useEffect, useState } from "react"

import type { OrderStatus } from "@/business/order/orderState"

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

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/restaurants/${encodeURIComponent(restaurantSlug)}/orders`, {
        cache: "no-store",
      })
      if (!response.ok) throw new Error("KITCHEN_ORDERS_UNAVAILABLE")
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

  const advance = async (order: KitchenOrder) => {
    const target = nextStatus[order.status]
    if (!target) return

    setTransitioning(order.orderId)
    setError(null)
    try {
      const response = await fetch(
        `/api/restaurants/${encodeURIComponent(restaurantSlug)}/orders/${encodeURIComponent(order.orderId)}/transitions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: target }),
        },
      )
      if (!response.ok) throw new Error("ORDER_TRANSITION_FAILED")
      const result = (await response.json()) as { status: OrderStatus }
      setOrders((current) =>
        current.map((item) => (item.orderId === order.orderId ? { ...item, status: result.status } : item)),
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
