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

test("accepts label with exactly 80 characters (boundary)", async () => {
  const label80 = "A".repeat(80)
  const repoOk: RestaurantTableRepository = {
    async createTable(input) {
      return { id: "id-80", label: input.label }
    },
  }
  const result = await createRestaurantTable({
    repository: repoOk,
    restaurantSlug: "demo",
    userId: "user-1",
    label: label80,
    signingSecret: "table-secret",
  })
  expect(result.label).toBe(label80)
})

test("rejects label with 81 characters", async () => {
  const repoUnreachable: RestaurantTableRepository = {
    async createTable() {
      throw new Error("should not reach repository")
    },
  }
  await expect(
    createRestaurantTable({
      repository: repoUnreachable,
      restaurantSlug: "demo",
      userId: "user-1",
      label: "A".repeat(81),
      signingSecret: "table-secret",
    }),
  ).rejects.toMatchObject({ code: "INVALID_TABLE_LABEL" })
})

test("throws TABLE_MANAGEMENT_FORBIDDEN when repository returns null (membership not found)", async () => {
  const repoNull: RestaurantTableRepository = {
    async createTable() {
      return null
    },
  }
  await expect(
    createRestaurantTable({
      repository: repoNull,
      restaurantSlug: "demo",
      userId: "user-1",
      label: "Mesa 2",
      signingSecret: "table-secret",
    }),
  ).rejects.toMatchObject({ code: "TABLE_MANAGEMENT_FORBIDDEN" })
})

test("throws TABLE_MANAGEMENT_FORBIDDEN when signingSecret is empty", async () => {
  await expect(
    createRestaurantTable({
      repository,
      restaurantSlug: "demo",
      userId: "user-1",
      label: "Mesa 3",
      signingSecret: "",
    }),
  ).rejects.toMatchObject({ code: "TABLE_MANAGEMENT_FORBIDDEN" })
})

test("generated tableId is used in result when createTableId is provided", async () => {
  const fixedId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
  const repoOk: RestaurantTableRepository = {
    async createTable(input) {
      return { id: input.tableId, label: input.label }
    },
  }
  const result = await createRestaurantTable({
    repository: repoOk,
    restaurantSlug: "demo",
    userId: "user-1",
    label: "Mesa 4",
    signingSecret: "table-secret",
    createTableId: () => fixedId,
  })
  expect(result.tableId).toBe(fixedId)
})
