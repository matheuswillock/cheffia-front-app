import { cleanup, render, screen, waitFor } from "@testing-library/react"
import type { OrderStatus } from "@/business/order/orderState"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const supabase = vi.hoisted(() => {
  const channel = {
    on: vi.fn(),
    subscribe: vi.fn(),
  }
  channel.on.mockReturnValue(channel)
  channel.subscribe.mockReturnValue(channel)
  const client = {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
  }
  return {
    channel,
    client,
    createClient: vi.fn((..._args: unknown[]) => client),
  }
})

vi.mock("@supabase/supabase-js", () => ({ createClient: supabase.createClient }))

const { useOrderRealtime } = await import("@/hooks/useOrderRealtime")

type PostgresChangeHandler = (payload: { new: Record<string, unknown> }) => void

function Probe(input: {
  onStatus: (status: OrderStatus) => void
  onSnapshot: (snapshot: { status: OrderStatus; version: number }) => void
}) {
  useOrderRealtime({
    orderId: "order-1",
    sessionId: "session-1",
    sessionToken: "session-token-12345678",
    onStatus: input.onStatus,
    onSnapshot: input.onSnapshot,
  })

  return <p>conectado</p>
}

function realtimeHandler() {
  const call = supabase.channel.on.mock.calls[0] as unknown[] | undefined
  if (!call) throw new Error("Realtime subscription was not registered")
  return call[2] as PostgresChangeHandler
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key")
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  supabase.createClient.mockClear()
  supabase.client.channel.mockClear()
  supabase.client.removeChannel.mockClear()
  supabase.channel.on.mockClear()
  supabase.channel.subscribe.mockClear()
})

describe("useOrderRealtime", () => {
  it("subscribes with a session-scoped token and applies ordered status events", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "session-jwt", expiresInSeconds: 300 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "preparing", version: 5 }), { status: 200 }))
    const onStatus = vi.fn()
    const onSnapshot = vi.fn()

    render(<Probe onStatus={onStatus} onSnapshot={onSnapshot} />)
    expect(screen.getByText("conectado")).toBeInTheDocument()

    await waitFor(() => expect(supabase.channel.subscribe).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/public/orders/order-1/realtime-token",
      expect.objectContaining({
        headers: {
          "X-Table-Session-Id": "session-1",
          "X-Table-Session-Token": "session-token-12345678",
        },
      }),
    )

    const options = supabase.createClient.mock.calls[0]?.[2] as { accessToken: () => Promise<string> }
    await expect(options.accessToken()).resolves.toBe("session-jwt")

    realtimeHandler()({ new: { status: "confirmed", version: 1 } })
    expect(onStatus).toHaveBeenCalledWith("confirmed")

    realtimeHandler()({ new: { status: "confirmed", version: 1 } })
    expect(onStatus).toHaveBeenCalledTimes(1)

    realtimeHandler()({ new: { status: "preparing", version: 5 } })
    await waitFor(() => expect(onSnapshot).toHaveBeenCalledWith({ status: "preparing", version: 5 }))
    expect(onStatus).toHaveBeenCalledTimes(1)
  })

  it("falls back to a persisted snapshot when token issuance is denied", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "ORDER_NOT_AVAILABLE" }), { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "ready", version: 3 }), { status: 200 }))
    const onStatus = vi.fn()
    const onSnapshot = vi.fn()

    render(<Probe onStatus={onStatus} onSnapshot={onSnapshot} />)

    await waitFor(() => expect(onSnapshot).toHaveBeenCalledWith({ status: "ready", version: 3 }))
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/public/orders/order-1",
      expect.objectContaining({ cache: "no-store" }),
    )
    expect(supabase.createClient).not.toHaveBeenCalled()
    expect(onStatus).not.toHaveBeenCalled()
  })
})
