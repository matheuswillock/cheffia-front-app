"use server";

import type {
  OrderItem,
  OrderStatus,
  OrderStatusResponse,
  OrderSubmitResponse,
} from "@/models/menuModels/mockedModels";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function submitOrder(items: OrderItem[]): Promise<OrderSubmitResponse> {
  await delay(1500);
  void items;

  const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    success: true,
    orderId,
  };
}

export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  await delay(500);

  const statuses: OrderStatus[] = ["received", "preparing", "ready", "delivered"];
  const randomIndex = Math.floor(Math.random() * 3);

  return {
    orderId,
    status: statuses[randomIndex],
    estimatedTime: 15 + Math.floor(Math.random() * 20),
  };
}
