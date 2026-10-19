import {
  createSessionToken,
  hashSessionToken,
  hashTableToken,
  verifyTableToken,
} from "@/business/order/tableToken"

export type TableLookup = {
  id: string
  tenantId: string
  restaurantId: string
  label: string
  restaurantSlug: string
}

type CreatedSession = {
  id: string
  tenantId: string
  restaurantId: string
  tableId: string
  tableLabel: string
  restaurantSlug: string
  sessionTokenHash: string
}

export type TableSessionRepository = {
  findActiveTable(input: { tableId: string; qrTokenHash: string }): Promise<TableLookup | null>
  createSession(input: {
    tenantId: string
    restaurantId: string
    tableId: string
    tokenHash: string
    expiresAt: Date
  }): Promise<CreatedSession>
}

export class TableSessionError extends Error {
  constructor(
    public readonly code: "INVALID_TABLE_TOKEN" | "TABLE_NOT_AVAILABLE",
  ) {
    super(code)
  }
}

export async function resolveTableSession(input: {
  repository: TableSessionRepository
  token: string
  signingSecret: string
  now?: Date
}) {
  const payload = verifyTableToken(input.token, input.signingSecret)
  if (!payload) {
    throw new TableSessionError("INVALID_TABLE_TOKEN")
  }

  const table = await input.repository.findActiveTable({
    tableId: payload.tableId,
    qrTokenHash: hashTableToken(input.token),
  })
  if (!table) {
    throw new TableSessionError("TABLE_NOT_AVAILABLE")
  }

  const now = input.now ?? new Date()
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000)
  const sessionToken = createSessionToken()
  const session = await input.repository.createSession({
    tenantId: table.tenantId,
    restaurantId: table.restaurantId,
    tableId: table.id,
    tokenHash: hashSessionToken(sessionToken),
    expiresAt,
  })

  return {
    sessionId: session.id,
    sessionToken,
    sessionTokenHash: session.sessionTokenHash,
    tenantId: session.tenantId,
    restaurantId: session.restaurantId,
    tableId: session.tableId,
    tableLabel: session.tableLabel,
    restaurantSlug: session.restaurantSlug,
    expiresAt,
  }
}
