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

    const connect = async () => {
      const tokenResponse = await fetch(
        `/api/public/orders/${encodeURIComponent(input.orderId as string)}/realtime-token`,
        { cache: "no-store", headers },
      )
      if (!tokenResponse.ok || disposed) {
        await resync().catch(() => undefined)
        return
      }

      const tokenPayload = await tokenResponse.json() as { token: string }
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !anonKey || disposed) {
        await resync().catch(() => undefined)
        return
      }

      client = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        accessToken: async () => tokenPayload.token,
      })
      channel = client
        .channel(`order:${input.orderId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${input.orderId}` },
          (payload) => {
            const row = payload.new as { id?: string; status?: OrderStatus; version?: number }
            if (!row.status || typeof row.version !== "number") return
            const result = applyOrderRealtimeEvent(stateRef.current, {
              eventId: `${input.orderId}:${row.version}`,
              orderId: input.orderId as string,
              eventVersion: 1,
              sequence: row.version,
              status: row.status,
            })
            stateRef.current = result.state
            if (result.action === "applied") input.onStatus(row.status)
            if (result.action === "resync") void resync().catch(() => undefined)
          },
        )
        .subscribe((status) => {
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
