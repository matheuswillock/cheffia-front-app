import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PublicOrderingFlow } from "@/components/Ordering/PublicOrderingFlow"

const menu = {
  restaurantId: "restaurant-1",
  restaurantSlug: "demo",
  categories: [
    {
      id: "category-1",
      name: "Pratos",
      sortOrder: 0,
      items: [
        {
          id: "item-1",
          name: "Burger",
          description: "Clássico",
          priceCents: 2500,
          currency: "BRL",
          sortOrder: 0,
          modifierGroups: [],
        },
      ],
    },
  ],
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.history.replaceState({}, "", "/restaurant/menu/demo")
  document.cookie = "cheffia_table_session=; Max-Age=0; path=/"
})

describe("PublicOrderingFlow", () => {
  it("loads the published menu and submits a session-scoped order", async () => {
    window.history.replaceState(
      {},
      "",
      "/restaurant/menu/demo?session_id=session-1&session_token=session-token-12345678",
    )
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(menu), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ orderId: "order-1", status: "pending", totalCents: 2500 }), {
          status: 201,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ orderId: "order-1", status: "pending" }), { status: 200 }),
      )

    const user = userEvent.setup()
    render(<PublicOrderingFlow restaurantSlug="demo" />)

    expect(await screen.findByText("Burger")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Adicionar Burger" }))
    await user.click(screen.getByRole("button", { name: "Adicionar Burger" }))
    await user.click(screen.getByRole("button", { name: "Enviar pedido" }))

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Pedido enviado"))
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/public/orders",
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("explains that a table session is required before checkout", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(menu), { status: 200 }))
    const user = userEvent.setup()
    render(<PublicOrderingFlow restaurantSlug="demo" />)

    expect(await screen.findByRole("alert")).toHaveTextContent("Abra o cardápio pelo QR Code da mesa")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("reads a cookie session, validates modifiers and reports order failures", async () => {
    const menuWithModifiers = {
      ...menu,
      categories: [{
        ...menu.categories[0],
        items: [{
          ...menu.categories[0].items[0],
          modifierGroups: [{
            id: "group-1",
            name: "Extras",
            minSelections: 1,
            maxSelections: 1,
            modifiers: [{ id: "modifier-1", name: "Bacon", priceDeltaCents: 500 }],
          }],
        }],
      }],
    }
    window.history.replaceState({}, "", "/restaurant/menu/demo")
    document.cookie = `cheffia_table_session=${encodeURIComponent(JSON.stringify({
      id: "session-1",
      token: "session-token-12345678",
    }))}; path=/`
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(menuWithModifiers), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))

    const user = userEvent.setup()
    render(<PublicOrderingFlow restaurantSlug="demo" />)

    await screen.findByText(/Bacon/)
    await user.click(screen.getByRole("radio"))
    await user.click(screen.getByRole("button", { name: "Adicionar Burger" }))
    await user.click(screen.getByRole("button", { name: "Enviar pedido" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível enviar o pedido")
  })
})
