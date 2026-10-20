"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"

import {
  applyOrderRealtimeEvent,
  createOrderRealtimeState,
  reconcileOrderRealtimeSnapshot,
  type OrderRealtimeState,
} from "@/business/order/orderRealtime"
import type { OrderStatus } from "@/business/order/orderState"

type OrderSnapshot = {
  status: OrderStatus
  version: number
}

export function useOrderRealtime(input: {
  orderId: string | undefined
  sessionId: string | null
  sessionToken: string | null
  onStatus: (status: OrderStatus) => void
  onSnapshot: (snapshot: OrderSnapshot) => void
}) {
  const stateRef = useRef<OrderRealtimeState>(createOrderRealtimeState("pending"))

  useEffect(() => {
    if (!input.orderId || !input.sessionId || !input.sessionToken) return

    let disposed = false
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null
    let client: ReturnType<typeof createClient> | null = null
    let subscribedOnce = false

    const headers = {
      "X-Table-Session-Id": input.sessionId,
      "X-Table-Session-Token": input.sessionToken,
    }

    const resync = async () => {
      const response = await fetch(`/api/public/orders/${encodeURIComponent(input.orderId as string)}`, {
        cache: "no-store",
        headers,
      })
      if (!response.ok || disposed) return
      const snapshot = await response.json() as OrderSnapshot
      stateRef.current = reconcileOrderRealtimeSnapshot(stateRef.current, snapshot)
      input.onSnapshot(snapshot)
    }

    // Called on connect and on every reconnect so an expired token is never reused.
    const requestToken = async () => {
      const response = await fetch(
        `/api/public/orders/${encodeURIComponent(input.orderId as string)}/realtime-token`,
        { cache: "no-store", headers },
      )
      if (!response.ok) throw new Error("Realtime token unavailable")
      const payload = await response.json() as { token: string }
      return payload.token
    }

    const connect = async () => {
      // Establish the version baseline before subscribing so the first event can be ordered.
      await resync().catch(() => undefined)
      try {
        await requestToken()
      } catch {
        await resync().catch(() => undefined)
        return
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !anonKey || disposed) {
        await resync().catch(() => undefined)
        return
      }

      client = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        accessToken: requestToken,
      })
      channel = client
        .channel(`order:${input.orderId}`, { config: { private: true } })
        .on(
          "broadcast",
          { event: "order.updated" },
          (payload) => {
            const row = payload.payload as { eventId?: string; orderId?: string; sequence?: number; status?: OrderStatus; version?: number }
            if (!row.status || typeof row.version !== "number" || typeof row.sequence !== "number" || !row.eventId || row.orderId !== input.orderId) return
            const result = applyOrderRealtimeEvent(stateRef.current, {
              eventId: row.eventId,
              orderId: input.orderId as string,
              eventVersion: 1,
              sequence: row.sequence,
              status: row.status,
            })
            stateRef.current = result.state
            if (result.action === "applied") input.onStatus(row.status)
            if (result.action === "resync") void resync().catch(() => undefined)
          },
        )
        .subscribe((status) => {
          if (disposed) return
          if (status === "SUBSCRIBED") {
            // A resubscribe means events may have been missed while offline.
            if (subscribedOnce) void resync().catch(() => undefined)
            subscribedOnce = true
            return
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            void resync().catch(() => undefined)
          }
        })
    }

    void connect().catch(() => resync().catch(() => undefined))

    return () => {
      disposed = true
      if (channel && client) void client.removeChannel(channel)
    }
  }, [input.orderId, input.sessionId, input.sessionToken, input.onSnapshot, input.onStatus])
}
