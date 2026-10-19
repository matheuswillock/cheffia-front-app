import { createHash } from "node:crypto"
import { z } from "zod"

const uuid = z.string().uuid()

const orderItemRequestSchema = z
  .object({
    menuItemId: uuid,
    quantity: z.number().int().min(1).max(99),
    modifierIds: z.array(uuid).max(20).default([]),
    note: z.string().trim().max(300).optional(),
  })
  .strict()

export const createOrderRequestSchema = z
  .object({
    sessionId: uuid,
    sessionToken: z.string().min(16).max(256),
    items: z.array(orderItemRequestSchema).min(1).max(50),
    note: z.string().trim().max(500).optional(),
  })
  .strict()

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>

const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

export function getIdempotencyKey(headers: Headers): string | null {
  const key = headers.get("Idempotency-Key")?.trim()

  if (!key || !idempotencyKeyPattern.test(key)) {
    return null
  }

  return key
}

function canonicalizeRequest(request: CreateOrderRequest) {
  const items = request.items
    .map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      modifierIds: [...item.modifierIds].sort(),
      note: item.note ?? null,
    }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))

  return {
    sessionId: request.sessionId,
    sessionToken: request.sessionToken,
    note: request.note ?? null,
    items,
  }
}

export async function hashOrderRequest(request: CreateOrderRequest): Promise<string> {
  return createHash("sha256")
    .update(JSON.stringify(canonicalizeRequest(request)))
    .digest("hex")
}
