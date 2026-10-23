import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

const realtime = vi.hoisted(() => {
  const channel = { on: vi.fn(), subscribe: vi.fn() }
  channel.on.mockReturnValue(channel)
  channel.subscribe.mockReturnValue(channel)
  const client = { channel: vi.fn(() => channel), removeChannel: vi.fn() }
  return { channel, client, createClient: vi.fn(async () => client) }
})

vi.mock("@/utils/supabase/client", () => ({ createClient: realtime.createClient }))

import { KitchenOrderHub } from "@/components/Ordering/KitchenOrderHub"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  realtime.createClient.mockClear()
  realtime.client.channel.mockClear()
  realtime.client.removeChannel.mockClear()
  realtime.channel.on.mockClear()
  realtime.channel.subscribe.mockClear()
})

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
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }) }),
    )
  })

  it("requires an accessible reason before rejecting a pending order", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify([{
      orderId: "order-1", status: "pending", tableLabel: "Mesa 1", createdAt: "2026-10-18T12:00:00.000Z", updatedAt: "2026-10-18T12:00:00.000Z", items: [],
    }]), { status: 200 }))
    const user = userEvent.setup()
    render(<KitchenOrderHub restaurantSlug="demo" />)
    await user.click(await screen.findByRole("button", { name: "Recusar pedido" }))
    expect(screen.getByLabelText("Motivo da recusa")).toBeRequired()
  })

  it("subscribes to the private restaurant topic when the authenticated queue identifies its restaurant", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify([]), {
      status: 200,
      headers: { "X-Restaurant-Id": "restaurant-1" },
    }))
    render(<KitchenOrderHub restaurantSlug="demo" />)
    await waitFor(() => expect(realtime.client.channel).toHaveBeenCalledWith(
      "restaurant:restaurant-1:orders", { config: { private: true } },
    ))
  })

  it("exposes a readable error when the kitchen queue cannot load", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 503 }))

    render(<KitchenOrderHub restaurantSlug="demo" />)

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar a fila")
  })

  it("reloads the kitchen queue when requested by staff", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))
    const user = userEvent.setup()

    render(<KitchenOrderHub restaurantSlug="demo" />)
    await screen.findByText("Nenhum pedido ativo.")
    await user.click(screen.getByRole("button", { name: "Atualizar" }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })
})
