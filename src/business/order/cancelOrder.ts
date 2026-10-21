import { transitionOrder, type OrderStatus } from "@/business/order/orderState"
import type { IdempotencyClaim, IdempotencyInput, OrderMutationResult } from "@/business/order/transitionOrder"

type CustomerOrder = {
  tenantId: string
  restaurantId: string
  status: OrderStatus
  version: number
}

type CancelTransaction = {
  findOrderForTableSession(input: {
    orderId: string
    sessionId: string
    sessionToken: string
  }): Promise<CustomerOrder | null>
  updateStatus(input: {
    orderId: string
    tenantId: string
    restaurantId: string
    expectedStatus: OrderStatus
    nextStatus: "cancelled"
  }): Promise<number | null>
  createTransition(input: {
    orderId: string
    tenantId: string
    restaurantId: string
    fromStatus: OrderStatus
    toStatus: "cancelled"
    actorRole: "customer"
  }): Promise<void>
  claimIdempotency?(input: IdempotencyInput): Promise<IdempotencyClaim>
  completeIdempotency?(input: IdempotencyInput & { responseBody: OrderMutationResult }): Promise<void>
  createOutboxEvent(input: {
    tenantId: string
    restaurantId: string
    aggregateId: string
    payload: Record<string, unknown>
  }): Promise<void>
}

export type CancelOrderRepository = {
  transaction<T>(callback: (transaction: CancelTransaction) => Promise<T>): Promise<T>
}

export class CancelOrderError extends Error {
  constructor(public readonly code: "ORDER_NOT_FOUND_OR_FORBIDDEN" | "ORDER_STATE_CONFLICT" | "IDEMPOTENCY_KEY_REUSE" | "IDEMPOTENCY_IN_PROGRESS") {
    super(code)
  }
}

export class CancelOrderRuleError extends Error {
  constructor(public readonly code: "ORDER_TRANSITION_NOT_ALLOWED") {
    super(code)
  }
}

export async function cancelOrderForCustomer(input: {
  repository: CancelOrderRepository
  orderId: string
  sessionId: string
  sessionToken: string
  idempotency?: Omit<IdempotencyInput, "tenantId" | "restaurantId">
}) {
  return input.repository.transaction(async (transaction) => {
    const order = await transaction.findOrderForTableSession(input)
    if (!order) throw new CancelOrderError("ORDER_NOT_FOUND_OR_FORBIDDEN")
    if (input.idempotency) {
      const claim = await transaction.claimIdempotency?.({ ...input.idempotency, tenantId: order.tenantId, restaurantId: order.restaurantId })
      if (!claim) throw new Error("Idempotency repository not configured")
      if (claim.kind === "replay") return claim.responseBody
      if (claim.kind === "conflict") throw new CancelOrderError("IDEMPOTENCY_KEY_REUSE")
      if (claim.kind === "in_progress") throw new CancelOrderError("IDEMPOTENCY_IN_PROGRESS")
    }

    const decision = transitionOrder(order.status, "cancelled", { role: "customer" })
    if (!decision.ok) throw new CancelOrderRuleError("ORDER_TRANSITION_NOT_ALLOWED")

    const version = await transaction.updateStatus({
      orderId: input.orderId,
      tenantId: order.tenantId,
      restaurantId: order.restaurantId,
      expectedStatus: order.status,
      nextStatus: "cancelled",
    })
    if (version === null) throw new CancelOrderError("ORDER_STATE_CONFLICT")

    await transaction.createTransition({
      orderId: input.orderId,
      tenantId: order.tenantId,
      restaurantId: order.restaurantId,
      fromStatus: order.status,
      toStatus: "cancelled",
      actorRole: "customer",
    })
    await transaction.createOutboxEvent({
      tenantId: order.tenantId,
      restaurantId: order.restaurantId,
      aggregateId: input.orderId,
      payload: { orderId: input.orderId, status: "cancelled", version },
    })

    const response = { orderId: input.orderId, status: "cancelled" as const, version }
    if (input.idempotency) await transaction.completeIdempotency?.({ ...input.idempotency, tenantId: order.tenantId, restaurantId: order.restaurantId, responseBody: response })
    return response
  })
}
