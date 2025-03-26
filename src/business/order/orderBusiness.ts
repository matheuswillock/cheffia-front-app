"use server"

import { OrderItem, OrderStatus, OrderStatusResponse, OrderSubmitResponse } from "@/models/menuModels/mockedModels"

// import type { OrderItem, OrderStatus, OrderStatusResponse, OrderSubmitResponse } from "./types"

// Simulate API calls with delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function submitOrder(items: OrderItem[]): Promise<OrderSubmitResponse> {
  await delay(1500) // Simulate network delay

  // In a real app, this would send the order to the backend
  const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`

  // Return a success response
  return {
    success: true,
    orderId,
  }
}

export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  await delay(500) // Simulate network delay

  // In a real app, this would fetch the order status from the backend
  // For demo purposes, we'll return a random status
  const statuses: OrderStatus[] = ["received", "preparing", "ready", "delivered"]
  const randomIndex = Math.floor(Math.random() * 3) // Exclude 'delivered' for demo

  return {
    orderId,
    status: statuses[randomIndex],
    estimatedTime: 15 + Math.floor(Math.random() * 20), // 15-35 minutes
  }
}

