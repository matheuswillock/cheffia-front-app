import { expect, test } from "bun:test"

import {
  resolveTableSession,
  type TableLookup,
  type TableSessionRepository,
} from "@/business/order/tableSession"
import { createTableToken, hashTableToken } from "@/business/order/tableToken"

const tableId = "00000000-0000-0000-0000-000000000001"
const tenantId = "00000000-0000-0000-0000-000000000002"
const restaurantId = "00000000-0000-0000-0000-000000000003"
const secret = "test-only-table-secret"

function repository(table: TableLookup | null): TableSessionRepository {
  return {
    async findActiveTable(input) {
      expect(input).toEqual({ tableId, qrTokenHash: hashTableToken(validToken) })
      return table
    },
    async createSession(input) {
      return {
        id: "00000000-0000-0000-0000-000000000004",
        tenantId: input.tenantId,
        restaurantId: input.restaurantId,
        tableId: input.tableId,
        tableLabel: "Mesa 1",
        restaurantSlug: "demo",
        sessionTokenHash: input.tokenHash,
      }
    },
  }
}

const validToken = createTableToken(tableId, secret, "fixed-nonce")
const table: TableLookup = {
  id: tableId,
  tenantId,
  restaurantId,
  label: "Mesa 1",
  restaurantSlug: "demo",
}

test("resolves a signed QR token into a fresh anonymous table session", async () => {
  const result = await resolveTableSession({
    repository: repository(table),
    token: validToken,
    signingSecret: secret,
    now: new Date("2026-10-18T12:00:00.000Z"),
  })

  expect(result.tableId).toBe(tableId)
  expect(result.restaurantSlug).toBe("demo")
  expect(result.sessionToken).not.toBe(result.sessionTokenHash)
  expect(result.expiresAt.toISOString()).toBe("2026-10-18T16:00:00.000Z")
})

test("rejects an invalid QR token before looking up a table", async () => {
  await expect(
    resolveTableSession({
      repository: repository(null),
      token: `${validToken}tampered`,
      signingSecret: secret,
    }),
  ).rejects.toMatchObject({ code: "INVALID_TABLE_TOKEN" })
})
