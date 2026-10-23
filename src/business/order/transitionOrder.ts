import {
  transitionOrder,
  type OrderRole,
  type OrderStatus,
} from "@/business/order/orderState"

type AuthorizedOrder = {
  tenantId: string
  restaurantId: string
  status: OrderStatus
  role: OrderRole
  version: number
}

type TransitionTransaction = {
  findAuthorizedOrder(input: {
    orderId: string
    restaurantSlug: string
    userId: string
  }): Promise<AuthorizedOrder | null>
  updateStatus(input: {
    orderId: string
    tenantId: string
    restaurantId: string
    expectedStatus: OrderStatus
    nextStatus: OrderStatus
  }): Promise<number | null>
  createTransition(input: {
    orderId: string
    tenantId: string
    restaurantId: string
    fromStatus: OrderStatus
    toStatus: OrderStatus
    actorUserId: string
    actorRole: OrderRole
    reason: string | null
  }): Promise<void>
  createOutboxEvent(input: {
    tenantId: string
    restaurantId: string
    aggregateId: string
    payload: Record<string, unknown>
  }): Promise<void>
  claimIdempotency?(input: IdempotencyInput): Promise<IdempotencyClaim>
  completeIdempotency?(input: IdempotencyInput & { responseBody: OrderMutationResult }): Promise<void>
}

export type OrderMutationResult = { orderId: string; status: OrderStatus; version: number }
export type IdempotencyInput = {
  tenantId: string; restaurantId: string; method: string; endpoint: string; idempotencyKey: string; requestHash: string
}
export type IdempotencyClaim =
  | { kind: "created" }
  | { kind: "replay"; responseBody: OrderMutationResult }
  | { kind: "conflict" }
  | { kind: "in_progress" }

export type OrderTransitionRepository = {
  transaction<T>(callback: (transaction: TransitionTransaction) => Promise<T>): Promise<T>
}

export class TransitionOrderError extends Error {
  constructor(
    public readonly code: "ORDER_NOT_FOUND_OR_FORBIDDEN" | "ORDER_STATE_CONFLICT" | "IDEMPOTENCY_KEY_REUSE" | "IDEMPOTENCY_IN_PROGRESS",
  ) {
    super(code)
  }
}

export class OrderTransitionRuleError extends Error {
  constructor(
    public readonly code: "ORDER_TRANSITION_NOT_ALLOWED" | "ORDER_REJECTION_REASON_REQUIRED",
  ) {
    super(code)
  }
}

export async function transitionOrderForStaff(input: {
  repository: OrderTransitionRepository
  orderId: string
  restaurantSlug: string
  userId: string
  nextStatus: OrderStatus
  reason?: string
  idempotency?: Omit<IdempotencyInput, "tenantId" | "restaurantId">
}) {
  return input.repository.transaction(async (transaction) => {
    const order = await transaction.findAuthorizedOrder({
      orderId: input.orderId,
      restaurantSlug: input.restaurantSlug,
      userId: input.userId,
    })
    if (!order) {
      throw new TransitionOrderError("ORDER_NOT_FOUND_OR_FORBIDDEN")
    }
    if (input.idempotency) {
      const claim = await transaction.claimIdempotency?.({ ...input.idempotency, tenantId: order.tenantId, restaurantId: order.restaurantId })
      if (!claim) throw new Error("Idempotency repository not configured")
      if (claim.kind === "replay") return claim.responseBody
      if (claim.kind === "conflict") throw new TransitionOrderError("IDEMPOTENCY_KEY_REUSE")
      if (claim.kind === "in_progress") throw new TransitionOrderError("IDEMPOTENCY_IN_PROGRESS")
    }

    const decision = transitionOrder(order.status, input.nextStatus, {
      role: order.role,
      reason: input.reason,
    })
    if (!decision.ok) {
      throw new OrderTransitionRuleError(decision.code)
    }

    const version = await transaction.updateStatus({
      orderId: input.orderId,
      tenantId: order.tenantId,
      restaurantId: order.restaurantId,
      expectedStatus: order.status,
      nextStatus: input.nextStatus,
    })
    if (version === null) {
      throw new TransitionOrderError("ORDER_STATE_CONFLICT")
    }

    await transaction.createTransition({
      orderId: input.orderId,
      tenantId: order.tenantId,
      restaurantId: order.restaurantId,
      fromStatus: order.status,
      toStatus: input.nextStatus,
      actorUserId: input.userId,
      actorRole: order.role,
      reason: input.reason?.trim() || null,
    })
    await transaction.createOutboxEvent({
      tenantId: order.tenantId,
      restaurantId: order.restaurantId,
      aggregateId: input.orderId,
      payload: {
        orderId: input.orderId,
        status: input.nextStatus,
        version,
      },
    })

    const response = { orderId: input.orderId, status: input.nextStatus, version }
    if (input.idempotency) {
      await transaction.completeIdempotency?.({ ...input.idempotency, tenantId: order.tenantId, restaurantId: order.restaurantId, responseBody: response })
    }
    return response
  })
}
