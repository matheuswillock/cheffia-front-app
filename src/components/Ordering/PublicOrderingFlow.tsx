"use client"

import { useEffect, useState } from "react"

import type { PublicMenu } from "@/business/order/publicMenu"
import type { OrderStatus } from "@/business/order/orderState"

type CartLine = {
  menuItemId: string
  name: string
  quantity: number
  priceCents: number
  modifierIds: string[]
}

type PublicOrderResponse = {
  orderId: string
  status: OrderStatus
  totalCents: number
}

type TableSession = {
  id: string | null
  token: string | null
}

export function PublicOrderingFlow({ restaurantSlug }: { restaurantSlug: string }) {
  const [menu, setMenu] = useState<PublicMenu | null>(null)
  const [session, setSession] = useState<TableSession>({ id: null, token: null })
  const [sessionResolved, setSessionResolved] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({})
  const [order, setOrder] = useState<PublicOrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const orderId = order?.orderId

  const sessionId = session.id
  const sessionToken = session.token

  useEffect(() => {
    setSession(readTableSession())
    setSessionResolved(true)
  }, [])

  useEffect(() => {
    let mounted = true

    if (!sessionResolved) return
    if (!sessionId || !sessionToken) {
      setError("Abra o cardápio pelo QR Code da mesa")
      setLoading(false)
      return
    }

    const headers: Record<string, string> = {}
    headers["X-Table-Session-Id"] = sessionId
    headers["X-Table-Session-Token"] = sessionToken

    void fetch(`/api/public/restaurants/${encodeURIComponent(restaurantSlug)}/menu`, {
      cache: "no-store",
      headers,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("MENU_UNAVAILABLE")
        return (await response.json()) as PublicMenu
      })
      .then((value) => {
        if (mounted) setMenu(value)
      })
      .catch(() => {
        if (mounted) setError("Não foi possível carregar o cardápio.")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [restaurantSlug, sessionId, sessionToken, sessionResolved])

  useEffect(() => {
    if (!orderId || !sessionId || !sessionToken) return

    let mounted = true
    const refresh = () => {
      void fetch(`/api/public/orders/${encodeURIComponent(orderId)}`, {
        cache: "no-store",
        headers: {
          "X-Table-Session-Id": sessionId,
          "X-Table-Session-Token": sessionToken,
        },
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("ORDER_STATUS_UNAVAILABLE")
          return (await response.json()) as { status: OrderStatus }
        })
        .then((value) => {
          if (mounted) setOrder((current) => (current ? { ...current, status: value.status } : current))
        })
        .catch(() => undefined)
    }

    refresh()
    const interval = window.setInterval(refresh, 10000)
    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [orderId, sessionId, sessionToken])

  const addItem = (item: PublicMenu["categories"][number]["items"][number]) => {
    const modifierIds = selectedModifiers[item.id] ?? []
    const missingRequiredGroup = item.modifierGroups.some((group) => {
      const selectedCount = modifierIds.filter((modifierId) =>
        group.modifiers.some((modifier) => modifier.id === modifierId),
      ).length
      return selectedCount < group.minSelections
    })
    if (missingRequiredGroup) {
      setError("Selecione as opções obrigatórias antes de adicionar o item.")
      return
    }

    setError(null)
    const modifierPriceCents = item.modifierGroups
      .flatMap((group) => group.modifiers)
      .filter((modifier) => modifierIds.includes(modifier.id))
      .reduce((sum, modifier) => sum + modifier.priceDeltaCents, 0)
    setCart((current) => {
      const existing = current.find(
        (line) => line.menuItemId === item.id && sameIds(line.modifierIds, modifierIds),
      )
      if (existing) {
        return current.map((line) =>
          line.menuItemId === item.id && sameIds(line.modifierIds, modifierIds)
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        )
      }
      return [...current, {
        menuItemId: item.id,
        name: item.name,
        quantity: 1,
        priceCents: item.priceCents + modifierPriceCents,
        modifierIds: [...modifierIds].sort(),
      }]
    })
  }

  const toggleModifier = (
    itemId: string,
    modifierId: string,
    maxSelections: number,
    groupModifierIds: string[],
  ) => {
    setSelectedModifiers((current) => {
      const selected = current[itemId] ?? []
      if (selected.includes(modifierId)) {
        return { ...current, [itemId]: selected.filter((id) => id !== modifierId) }
      }
      if (maxSelections === 1) {
        return {
          ...current,
          [itemId]: [...selected.filter((id) => !groupModifierIds.includes(id)), modifierId],
        }
      }
      return { ...current, [itemId]: [...selected, modifierId] }
    })
  }

  const totalCents = cart.reduce((sum, line) => sum + line.priceCents * line.quantity, 0)

  const submit = async () => {
    if (!sessionId || !sessionToken) {
      setError("Abra o cardápio pelo QR Code da mesa")
      return
    }
    if (!cart.length) return

    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch("/api/public/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          sessionId,
          sessionToken,
          items: cart.map((line) => ({
            menuItemId: line.menuItemId,
            quantity: line.quantity,
            modifierIds: line.modifierIds,
          })),
        }),
      })
      if (!response.ok) throw new Error("ORDER_UNAVAILABLE")
      setOrder((await response.json()) as PublicOrderResponse)
      setCart([])
    } catch {
      setError("Não foi possível enviar o pedido. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p role="status">Carregando cardápio…</p>
  if (!menu) return <p role="alert">{error ?? "Cardápio indisponível."}</p>

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="menu-title">
        <h1 id="menu-title" className="mb-6 text-3xl font-bold">
          {menu.restaurantSlug}
        </h1>
        <div className="space-y-6">
          {menu.categories.map((category) => (
            <section key={category.id} aria-labelledby={`category-${category.id}`}>
              <h2 id={`category-${category.id}`} className="mb-3 text-xl font-semibold">
                {category.name}
              </h2>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <article key={item.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        <p className="mt-2 font-medium">{formatCents(item.priceCents, item.currency)}</p>
                        {item.modifierGroups.map((group) => (
                          <fieldset key={group.id} className="mt-3 space-y-1 text-sm">
                            <legend className="font-medium">
                              {group.name} {group.minSelections > 0 ? "(obrigatório)" : "(opcional)"}
                            </legend>
                            {group.modifiers.map((modifier) => {
                              const selected = (selectedModifiers[item.id] ?? []).includes(modifier.id)
                              return (
                                <label key={modifier.id} className="flex items-center gap-2">
                                  <input
                                    type={group.maxSelections === 1 ? "radio" : "checkbox"}
                                    name={`${item.id}-${group.id}`}
                                    checked={selected}
                                    onChange={() => toggleModifier(
                                      item.id,
                                      modifier.id,
                                      group.maxSelections,
                                      group.modifiers.map((groupModifier) => groupModifier.id),
                                    )}
                                  />
                                  <span>{modifier.name} (+{formatCents(modifier.priceDeltaCents, item.currency)})</span>
                                </label>
                              )
                            })}
                          </fieldset>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                        onClick={() => addItem(item)}
                        aria-label={`Adicionar ${item.name}`}
                      >
                        Adicionar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <aside className="h-fit rounded-xl border p-4 lg:sticky lg:top-4">
        <h2 className="text-xl font-semibold">Seu pedido</h2>
        {cart.length ? (
          <ul className="my-4 space-y-2">
            {cart.map((line) => (
            <li key={`${line.menuItemId}-${line.modifierIds.join("-")}`} className="flex justify-between gap-3 text-sm">
                <span>{line.quantity}× {line.name}</span>
                <span>{formatCents(line.priceCents * line.quantity, "BRL")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="my-4 text-sm text-muted-foreground">Adicione itens para começar.</p>
        )}
        <div className="flex justify-between border-t pt-3 font-semibold">
          <span>Total</span>
          <span>{formatCents(totalCents, "BRL")}</span>
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50"
          onClick={submit}
          disabled={!cart.length || submitting || Boolean(order)}
        >
          {submitting ? "Enviando…" : "Enviar pedido"}
        </button>
        {order && (
          <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">
            Pedido enviado · status: <strong>{order.status}</strong>
          </p>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </aside>
    </main>
  )
}

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100)
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function readTableSession(): TableSession {
  const params = new URLSearchParams(window.location.search)
  const fromQuery = {
    id: params.get("session_id"),
    token: params.get("session_token"),
  }
  if (fromQuery.id && fromQuery.token) return fromQuery

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("cheffia_table_session="))
    ?.slice("cheffia_table_session=".length)
  if (!cookie) return fromQuery

  try {
    const parsed = JSON.parse(decodeURIComponent(cookie)) as { id?: unknown; token?: unknown }
    return {
      id: typeof parsed.id === "string" ? parsed.id : null,
      token: typeof parsed.token === "string" ? parsed.token : null,
    }
  } catch {
    return fromQuery
  }
}
