import { expect, test } from "bun:test"

import {
  createRestaurantTable,
  type RestaurantTableRepository,
} from "@/business/order/createTable"

const repository: RestaurantTableRepository = {
  async createTable(input) {
    expect(input.label).toBe("Mesa 1")
    expect(input.qrTokenHash).not.toContain("v1.")
    return { id: input.tableId, label: input.label }
  },
}

test("creates a manager-scoped table with a signed QR destination", async () => {
  const result = await createRestaurantTable({
    repository,
    restaurantSlug: "demo",
    userId: "user-1",
    label: "Mesa 1",
    signingSecret: "table-secret",
    createTableId: () => "00000000-0000-0000-0000-000000000001",
  })

  expect(result).toEqual({
    tableId: "00000000-0000-0000-0000-000000000001",
    label: "Mesa 1",
    signedToken: expect.any(String),
  })
  expect(result.signedToken).toContain("v1.")
})

test("rejects blank or oversized labels before persistence", async () => {
  await expect(
    createRestaurantTable({
      repository,
      restaurantSlug: "demo",
      userId: "user-1",
      label: " ",
      signingSecret: "table-secret",
    }),
  ).rejects.toMatchObject({ code: "INVALID_TABLE_LABEL" })
})
