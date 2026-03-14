"use client"

import { OrderItem } from "@/models/menuModels/mockedModels"
import { create } from "zustand"
// import type { OrderItem } from "./types"

interface OrderState {
  items: OrderItem[]
  currentOrderId: string | null
  totalAmount: number
  addItem: (item: OrderItem) => void
  removeItem: (itemId: string) => void
  clearItems: () => void
  setCurrentOrderId: (orderId: string) => void
}

export const useOrderStore = create<OrderState>((set) => ({
  items: [],
  currentOrderId: null,
  totalAmount: 0,

  addItem: (item) =>
    set((state) => {
      const newItems = [...state.items, item]
      return {
        items: newItems,
        totalAmount: calculateTotal(newItems),
      }
    }),

  removeItem: (itemId) =>
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== itemId)
      return {
        items: newItems,
        totalAmount: calculateTotal(newItems),
      }
    }),

  clearItems: () => set({ items: [], totalAmount: 0 }),

  setCurrentOrderId: (orderId) => set({ currentOrderId: orderId }),
}))

function calculateTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + item.subtotal, 0)
}

