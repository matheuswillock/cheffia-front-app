import { expect, test } from "bun:test"

import {
  getPublicOrderStatus,
  type PublicOrderStatusRepository,
} from "@/business/order/orderStatus"

const order = {
  id: "00000000-0000-0000-0000-000000000010",
  status: "preparing" as const,
  version: 2,
  totalCents: 4600,
  currency: "BRL",
  createdAt: new Date("2026-10-18T12:00:00.000Z"),
  updatedAt: new Date("2026-10-18T12:05:00.000Z"),
  items: [{ nameSnapshot: "Burger", quantity: 2, lineTotalCents: 4600 }],
}

const repository: PublicOrderStatusRepository = {
  async findOrder() {
    return order
  },
}

test("returns a session-scoped order status with immutable item snapshots", async () => {
  await expect(
    getPublicOrderStatus({
      repository,
      orderId: order.id,
      sessionId: "00000000-0000-0000-0000-000000000003",
      sessionToken: "session-token-12345678",
    }),
  ).resolves.toEqual({
    orderId: order.id,
    status: "preparing",
    version: 2,
    totalCents: 4600,
    currency: "BRL",
    createdAt: "2026-10-18T12:00:00.000Z",
    updatedAt: "2026-10-18T12:05:00.000Z",
    items: [{ name: "Burger", quantity: 2, lineTotalCents: 4600 }],
  })
})

test("does not reveal an order outside the active table session", async () => {
  const unavailable: PublicOrderStatusRepository = {
    async findOrder() {
      return null
    },
  }

  await expect(
    getPublicOrderStatus({
      repository: unavailable,
      orderId: order.id,
      sessionId: "00000000-0000-0000-0000-000000000003",
      sessionToken: "session-token-12345678",
    }),
  ).rejects.toMatchObject({ code: "ORDER_NOT_AVAILABLE" })
})
