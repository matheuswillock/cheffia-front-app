import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { KitchenOrderHub } from "@/components/Ordering/KitchenOrderHub"

afterEach(() => vi.restoreAllMocks())

describe("KitchenOrderHub", () => {
  it("lists scoped orders and advances one through a valid transition", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              orderId: "order-1",
              status: "pending",
              tableLabel: "Mesa 1",
              createdAt: "2026-10-18T12:00:00.000Z",
              updatedAt: "2026-10-18T12:00:00.000Z",
              items: [{ name: "Burger", quantity: 1, note: null }],
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "confirmed" }), { status: 200 }))

    const user = userEvent.setup()
    render(<KitchenOrderHub restaurantSlug="demo" />)

    expect(await screen.findByText("Mesa 1")).toBeInTheDocument()
    expect(screen.getByText("Pendente")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Confirmar pedido order-1" }))

    await waitFor(() => expect(screen.getByText("Confirmado")).toBeInTheDocument())
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/restaurants/demo/orders/order-1/transitions",
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("exposes a readable error when the kitchen queue cannot load", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 503 }))

    render(<KitchenOrderHub restaurantSlug="demo" />)

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar a fila")
  })
})
