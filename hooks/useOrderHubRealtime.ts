"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

interface OutboxEventRow {
  id: string;
  tenant_id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

export interface OrderHubRealtimeEvent {
  id: string;
  tenantId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  status: string;
  createdAt: string;
  restaurantId: string;
  orderId: string | null;
  orderNumber: number | null;
  tableNumber: string | null;
  transactionId: string | null;
  paymentStatus: string | null;
  source: "snapshot" | "realtime";
  payload: Record<string, unknown>;
}

type ConnectionStatus = "CONNECTING" | "SUBSCRIBED" | "TIMED_OUT" | "CHANNEL_ERROR" | "CLOSED";

const OUTBOX_TABLE = "outbox_events";
const ORDER_AGGREGATE_TYPE = "customer_order";

const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const parseJwtPayload = (token: string): Record<string, unknown> => {
  const parts = token.split(".");
  if (parts.length < 2) return {};

  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json);
    return asObject(parsed);
  } catch {
    return {};
  }
};

const resolveTenantIdFromSession = async (supabase: SupabaseClient): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const fromAppMetadata = readString(session?.user?.app_metadata?.tenant_id);
  if (fromAppMetadata) return fromAppMetadata;

  const fromUserMetadata = readString(session?.user?.user_metadata?.tenant_id);
  if (fromUserMetadata) return fromUserMetadata;

  const token = readString(session?.access_token);
  if (!token) return null;

  const claims = parseJwtPayload(token);
  return (
    readString(claims.tenant_id) ??
    readString(claims.tenantId) ??
    readString(claims["https://cheffia.com/tenant_id"])
  );
};

const eventToModel = (
  row: OutboxEventRow,
  source: OrderHubRealtimeEvent["source"]
): OrderHubRealtimeEvent | null => {
  const payload = asObject(row.payload);
  const restaurantId = readString(payload.restaurantId);
  if (!restaurantId) return null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    eventType: row.event_type,
    status: row.status,
    createdAt: row.created_at,
    restaurantId,
    orderId: readString(payload.orderId),
    orderNumber: readNumber(payload.orderNumber),
    tableNumber: readString(payload.tableNumber),
    transactionId: readString(payload.transactionId),
    paymentStatus: readString(payload.status),
    payload,
    source,
  };
};

const sortByNewest = (events: OrderHubRealtimeEvent[]): OrderHubRealtimeEvent[] =>
  [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const useOrderHubRealtime = (restaurantId: string, enabled = true) => {
  const [events, setEvents] = useState<OrderHubRealtimeEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("CONNECTING");
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const clientRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      setConnectionStatus("CLOSED");
      setError(null);
      return () => undefined;
    }

    if (!restaurantId) {
      setEvents([]);
      setConnectionStatus("CLOSED");
      setError("Restaurant ID is required to subscribe realtime events.");
      return () => undefined;
    }

    let cancelled = false;

    const appendEvent = (event: OrderHubRealtimeEvent) => {
      setEvents((previous) => {
        const without = previous.filter((item) => item.id !== event.id);
        return sortByNewest([event, ...without]);
      });
    };

    const bootstrap = async () => {
      try {
        setConnectionStatus("CONNECTING");
        setError(null);
        setEvents([]);

        const supabase = await createSupabaseClient();
        if (cancelled) return;
        clientRef.current = supabase;

        const tenantId = await resolveTenantIdFromSession(supabase);
        if (cancelled) return;

        let snapshotQuery = supabase
          .from(OUTBOX_TABLE)
          .select(
            "id, tenant_id, aggregate_type, aggregate_id, event_type, payload, status, created_at"
          )
          .eq("aggregate_type", ORDER_AGGREGATE_TYPE)
          .order("created_at", { ascending: false })
          .limit(100);

        if (tenantId) {
          snapshotQuery = snapshotQuery.eq("tenant_id", tenantId);
        }

        const { data: snapshot, error: snapshotError } = await snapshotQuery;

        if (snapshotError) {
          setError(`Failed to load order events snapshot: ${snapshotError.message}`);
        } else {
          const initial = (snapshot ?? [])
            .map((row) => eventToModel(row as OutboxEventRow, "snapshot"))
            .filter((event): event is OrderHubRealtimeEvent => Boolean(event))
            .filter((event) => (tenantId ? event.tenantId === tenantId : true))
            .filter((event) => event.restaurantId === restaurantId);
          setEvents(sortByNewest(initial));
        }

        const channelName = tenantId
          ? `orderhub:tenant:${tenantId}:restaurant:${restaurantId}:outbox`
          : `orderhub:restaurant:${restaurantId}:outbox`;
        const realtimeFilter = tenantId
          ? `tenant_id=eq.${tenantId}`
          : `aggregate_type=eq.${ORDER_AGGREGATE_TYPE}`;

        const channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: OUTBOX_TABLE,
              filter: realtimeFilter,
            },
            (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
              const mapped = eventToModel(payload.new as unknown as OutboxEventRow, "realtime");
              if (!mapped) return;
              if (mapped.aggregateType !== ORDER_AGGREGATE_TYPE) return;
              if (tenantId && mapped.tenantId !== tenantId) return;
              if (mapped.restaurantId !== restaurantId) return;
              appendEvent(mapped);
            }
          )
          .subscribe((status) => {
            setConnectionStatus(status);
          });

        channelRef.current = channel;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unexpected realtime error";
        setError(message);
        setConnectionStatus("CHANNEL_ERROR");
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
      const channel = channelRef.current;
      const client = clientRef.current;
      channelRef.current = null;
      clientRef.current = null;

      if (channel && client) {
        void client.removeChannel(channel);
      }
    };
  }, [enabled, restaurantId]);

  const realtimeEvents = useMemo(() => sortByNewest(events), [events]);

  return {
    events: realtimeEvents,
    connectionStatus,
    error,
  };
};
