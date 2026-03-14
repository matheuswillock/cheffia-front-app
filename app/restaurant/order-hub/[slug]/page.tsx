"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useOrderHubRealtime } from "@/hooks/useOrderHubRealtime";
import type { OrderHubEventView } from "@/components/OrderHubContent/types";
import MoreDetails from "@/components/OrderHubContent/MoreDetails";
import OrderList from "@/components/OrderHubContent/OrderList";

export default function OrderHubPage() {
    const { slug } = useParams<{ slug: string | string[] }>();
    const restaurantId = Array.isArray(slug) ? (slug[0] ?? "") : (slug ?? "");
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const { events: realtimeEvents, connectionStatus, error } = useOrderHubRealtime(restaurantId);

    const events = useMemo<OrderHubEventView[]>(
        () =>
            realtimeEvents.map((event) => ({
                id: event.id,
                eventType: event.eventType,
                status: event.status,
                createdAt: event.createdAt,
                restaurantId: event.restaurantId,
                orderId: event.orderId,
                orderNumber: event.orderNumber,
                tableNumber: event.tableNumber,
                transactionId: event.transactionId,
                paymentStatus: event.paymentStatus,
                payload: event.payload,
            })),
        [realtimeEvents]
    );

    const selectedEvent = useMemo(
        () => events.find((event) => event.id === selectedEventId) ?? null,
        [events, selectedEventId]
    );

    useEffect(() => {
        if (events.length === 0) {
            setSelectedEventId(null);
            return;
        }

        setSelectedEventId((current) => {
            if (current && events.some((event) => event.id === current)) {
                return current;
            }
            return events[0].id;
        });
    }, [events]);

    return (
        <div className="flex min-h-svh flex-col items-center gap-6 flex-1 px-8 my-8 ">
            <div className="flex flex-col flex-initial gap-2 border-b-2 px-2 w-max ">
                <h2 className="text-3xl text-foreground-default">Central de Pedidos</h2>
                <p className="text-sm text-muted-foreground/80">Realtime: {connectionStatus}</p>
                {error ? <p className="text-xs text-red-400">{error}</p> : null}
            </div>

            <div className="grid grid-cols-4 gap-4 w-[100%] min-h-[80vh] max-h-[80vh] border-2 rounded-xl ">
                <div className="border-r-2 col-span-1">
                    
                    <h2 className="text-3xl text-foreground-default ml-4 my-2">Pedidos</h2>
                    <OrderList
                        events={events}
                        selectedEventId={selectedEventId}
                        onSelectEvent={setSelectedEventId}
                    />
                </div>

                <div className="col-span-3">
                    <h2 className="text-3xl text-foreground-default ml-4 my-2">Mais Detalhes</h2>
                    <MoreDetails event={selectedEvent} />
                </div>
            </div>
        </div>

    );
}
