import { expect, test } from "bun:test"

import {
  listKitchenOrders,
  type KitchenOrdersRepository,
} from "@/business/order/kitchenOrders"

const repository: KitchenOrdersRepository = {
  async findOrders() {
    return [
      {
        id: "order-2",
        status: "confirmed",
        tableLabel: "Mesa 2",
        createdAt: new Date("2026-10-18T12:02:00.000Z"),
        updatedAt: new Date("2026-10-18T12:02:00.000Z"),
        items: [{ name: "Pizza", quantity: 1, note: null }],
      },
      {
        id: "order-1",
        status: "pending",
        tableLabel: "Mesa 1",
        createdAt: new Date("2026-10-18T12:00:00.000Z"),
        updatedAt: new Date("2026-10-18T12:00:00.000Z"),
        items: [{ name: "Burger", quantity: 2, note: "Sem cebola" }],
      },
    ]
  },
}

test("returns kitchen orders in queue order with snapshot fields", async () => {
  await expect(
    listKitchenOrders({
      repository,
      restaurantSlug: "demo",
      userId: "user-1",
      statuses: ["pending", "confirmed"],
    }),
  ).resolves.toEqual([
    {
      orderId: "order-2",
      status: "confirmed",
      tableLabel: "Mesa 2",
      createdAt: "2026-10-18T12:02:00.000Z",
      updatedAt: "2026-10-18T12:02:00.000Z",
      items: [{ name: "Pizza", quantity: 1, note: null }],
    },
    {
      orderId: "order-1",
      status: "pending",
      tableLabel: "Mesa 1",
      createdAt: "2026-10-18T12:00:00.000Z",
      updatedAt: "2026-10-18T12:00:00.000Z",
      items: [{ name: "Burger", quantity: 2, note: "Sem cebola" }],
    },
  ])
})

test("maps an unauthorized restaurant to a non-enumerating domain error", async () => {
  const unavailable: KitchenOrdersRepository = {
    async findOrders() {
      return null
    },
  }

  await expect(
    listKitchenOrders({
      repository: unavailable,
      restaurantSlug: "missing",
      userId: "user-1",
      statuses: [],
    }),
  ).rejects.toMatchObject({ code: "KITCHEN_ACCESS_DENIED" })
})
