import type { OrderHubEventView } from "@/components/OrderHubContent/types";

export const collectNewRealtimeOrderSentEventIds = (
  events: OrderHubEventView[],
  seenEventIds: Set<string>
): string[] =>
  events
    .filter((event) => event.eventType === "order.sent")
    .filter((event) => event.source === "realtime")
    .filter((event) => !seenEventIds.has(event.id))
    .map((event) => event.id);

export const collectAutoPrintableRealtimeOrderSentEventIds = (
  events: OrderHubEventView[],
  seenEventIds: Set<string>,
  printingEnabled: boolean
): string[] => {
  const freshRealtimeEventIds = collectNewRealtimeOrderSentEventIds(events, seenEventIds);

  if (!printingEnabled) {
    for (const eventId of freshRealtimeEventIds) {
      seenEventIds.add(eventId);
    }

    return [];
  }

  return freshRealtimeEventIds;
};
