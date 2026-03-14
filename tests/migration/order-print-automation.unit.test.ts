import { describe, expect, test } from "bun:test";
import {
  collectAutoPrintableRealtimeOrderSentEventIds,
  collectNewRealtimeOrderSentEventIds,
} from "@/app/restaurant/order-hub/[slug]/features/services/order-hub-print-automation";
import type { OrderHubEventView } from "@/components/OrderHubContent/types";

const event = (
  id: string,
  eventType: string,
  source: "snapshot" | "realtime"
): OrderHubEventView => ({
  id,
  eventType,
  source,
  status: "pending",
  createdAt: "2026-03-14T10:00:00.000Z",
  restaurantId: "rest-1",
  orderId: "order-1",
  orderNumber: 1,
  tableNumber: "12",
  transactionId: null,
  paymentStatus: null,
  payload: {},
});

describe("order hub print automation selector", () => {
  test("ignores snapshot events and non-order.sent events", () => {
    const seen = new Set<string>();

    const result = collectNewRealtimeOrderSentEventIds(
      [
        event("evt-1", "order.sent", "snapshot"),
        event("evt-2", "order.payment.confirmed", "realtime"),
        event("evt-3", "order.sent", "realtime"),
      ],
      seen
    );

    expect(result).toEqual(["evt-3"]);
  });

  test("filters events that are already seen", () => {
    const seen = new Set<string>(["evt-1"]);

    const result = collectNewRealtimeOrderSentEventIds(
      [event("evt-1", "order.sent", "realtime"), event("evt-2", "order.sent", "realtime")],
      seen
    );

    expect(result).toEqual(["evt-2"]);
  });

  test("does not enqueue auto print when printing is disabled and marks events as seen", () => {
    const seen = new Set<string>();

    const result = collectAutoPrintableRealtimeOrderSentEventIds(
      [event("evt-1", "order.sent", "realtime"), event("evt-2", "order.sent", "realtime")],
      seen,
      false
    );

    expect(result).toEqual([]);
    expect(Array.from(seen)).toEqual(["evt-1", "evt-2"]);
  });
});
