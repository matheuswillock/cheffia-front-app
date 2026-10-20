import { hashSessionToken } from "@/business/order/tableToken"
import { createSupabaseRealtimeToken } from "@/business/order/realtimeToken"

export type RealtimeSessionRepository = {
  hasActiveSession(input: {
    orderId: string
    sessionId: string
    sessionTokenHash: string
    now: Date
  }): Promise<boolean>
}

export class RealtimeSessionError extends Error {
  constructor(public readonly code: "ORDER_NOT_AVAILABLE") {
    super(code)
  }
}

export async function issueOrderRealtimeToken(input: {
  repository: RealtimeSessionRepository
  orderId: string
  sessionId: string
  sessionToken: string
  jwtSecret: string
  now?: Date
}) {
  const now = input.now ?? new Date()
  const allowed = await input.repository.hasActiveSession({
    orderId: input.orderId,
    sessionId: input.sessionId,
    sessionTokenHash: hashSessionToken(input.sessionToken),
    now,
  })
  if (!allowed) {
    throw new RealtimeSessionError("ORDER_NOT_AVAILABLE")
  }

  return {
    token: createSupabaseRealtimeToken({
      sessionId: input.sessionId,
      jwtSecret: input.jwtSecret,
      now,
    }),
    expiresInSeconds: 300,
  }
}
