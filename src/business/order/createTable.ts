import { randomUUID } from "node:crypto"

import { hashTableToken, createTableToken } from "@/business/order/tableToken"

export type RestaurantTableRepository = {
  createTable(input: {
    tableId: string
    restaurantSlug: string
    userId: string
    label: string
    qrTokenHash: string
  }): Promise<{ id: string; label: string } | null>
}

export class CreateTableError extends Error {
  constructor(public readonly code: "INVALID_TABLE_LABEL" | "TABLE_MANAGEMENT_FORBIDDEN") {
    super(code)
  }
}

export async function createRestaurantTable(input: {
  repository: RestaurantTableRepository
  restaurantSlug: string
  userId: string
  label: string
  signingSecret: string
  createTableId?: () => string
}) {
  const label = input.label.trim()
  if (!label || label.length > 80) {
    throw new CreateTableError("INVALID_TABLE_LABEL")
  }
  if (!input.signingSecret) {
    throw new CreateTableError("TABLE_MANAGEMENT_FORBIDDEN")
  }

  const tableId = input.createTableId?.() ?? randomUUID()
  const signedToken = createTableToken(tableId, input.signingSecret)
  const table = await input.repository.createTable({
    tableId,
    restaurantSlug: input.restaurantSlug,
    userId: input.userId,
    label,
    qrTokenHash: hashTableToken(signedToken),
  })

  if (!table) {
    throw new CreateTableError("TABLE_MANAGEMENT_FORBIDDEN")
  }

  return {
    tableId: table.id,
    label: table.label,
    signedToken,
  }
}
