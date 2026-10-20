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
type SubscriptionHandler = (status: string) => void

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

function subscriptionHandler() {
  const call = supabase.channel.subscribe.mock.calls[0] as unknown[] | undefined
  if (!call) throw new Error("Realtime subscription was not started")
  return call[0] as SubscriptionHandler
}

function mockFetch(snapshot: () => { status: OrderStatus; version: number }) {
  let tokens = 0
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input)
    if (url === "/api/public/orders/order-1/realtime-token") {
      tokens += 1
      return new Response(JSON.stringify({ token: `session-jwt-${tokens}`, expiresInSeconds: 300 }), {
        status: 200,
      })
    }
    if (url === "/api/public/orders/order-1") {
      return new Response(JSON.stringify(snapshot()), { status: 200 })
    }
    return new Response(null, { status: 404 })
  })
  return fetchMock
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
    let snapshot = { status: "pending" as OrderStatus, version: 3 }
    const fetchMock = mockFetch(() => snapshot)
    const onStatus = vi.fn()
    const onSnapshot = vi.fn()

    render(<Probe onStatus={onStatus} onSnapshot={onSnapshot} />)
    expect(screen.getByText("conectado")).toBeInTheDocument()

    await waitFor(() => expect(supabase.channel.subscribe).toHaveBeenCalledTimes(1))
    expect(onSnapshot).toHaveBeenCalledWith({ status: "pending", version: 3 })
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/orders/order-1/realtime-token",
      expect.objectContaining({
        headers: {
          "X-Table-Session-Id": "session-1",
          "X-Table-Session-Token": "session-token-12345678",
        },
      }),
    )

    const options = supabase.createClient.mock.calls[0]?.[2] as { accessToken: () => Promise<string> }
    await expect(options.accessToken()).resolves.toBe("session-jwt-2")

    subscriptionHandler()("SUBSCRIBED")
    expect(onSnapshot).toHaveBeenCalledTimes(1)

    realtimeHandler()({ new: { status: "confirmed", version: 4 } })
    expect(onStatus).toHaveBeenCalledWith("confirmed")

    realtimeHandler()({ new: { status: "confirmed", version: 4 } })
    expect(onStatus).toHaveBeenCalledTimes(1)

    snapshot = { status: "preparing", version: 6 }
    subscriptionHandler()("SUBSCRIBED")
    await waitFor(() => expect(onSnapshot).toHaveBeenCalledWith({ status: "preparing", version: 6 }))

    realtimeHandler()({ new: { status: "preparing", version: 6 } })
    expect(onStatus).toHaveBeenCalledTimes(1)

    realtimeHandler()({ new: { status: "ready", version: 7 } })
    expect(onStatus).toHaveBeenLastCalledWith("ready")

    cleanup()
    expect(supabase.client.removeChannel).toHaveBeenCalledTimes(1)
  })

  it("falls back to a persisted snapshot when token issuance is denied", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input)
      if (url === "/api/public/orders/order-1/realtime-token") {
        return new Response(JSON.stringify({ code: "ORDER_NOT_AVAILABLE" }), { status: 404 })
      }
      if (url === "/api/public/orders/order-1") {
        return new Response(JSON.stringify({ status: "ready", version: 3 }), { status: 200 })
      }
      return new Response(null, { status: 404 })
    })
    const onStatus = vi.fn()
    const onSnapshot = vi.fn()

    render(<Probe onStatus={onStatus} onSnapshot={onSnapshot} />)

    await waitFor(() => expect(onSnapshot).toHaveBeenCalledWith({ status: "ready", version: 3 }))
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/orders/order-1",
      expect.objectContaining({ cache: "no-store" }),
    )
    expect(supabase.createClient).not.toHaveBeenCalled()
    expect(onStatus).not.toHaveBeenCalled()
  })
})
