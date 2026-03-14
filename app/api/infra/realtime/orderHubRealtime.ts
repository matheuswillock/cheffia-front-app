export const ORDERHUB_REALTIME_TABLE = "outbox_events";

export const ORDERHUB_AGGREGATE_TYPE = "customer_order";

export const buildOrderHubRealtimeChannel = (restaurantId: string): string =>
  `orderhub:restaurant:${restaurantId}:outbox`;
