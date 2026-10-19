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
  }): Promise<boolean>
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
}

export type OrderTransitionRepository = {
  transaction<T>(callback: (transaction: TransitionTransaction) => Promise<T>): Promise<T>
}

export class TransitionOrderError extends Error {
  constructor(
    public readonly code: "ORDER_NOT_FOUND_OR_FORBIDDEN" | "ORDER_STATE_CONFLICT",
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

    const decision = transitionOrder(order.status, input.nextStatus, {
      role: order.role,
      reason: input.reason,
    })
    if (!decision.ok) {
      throw new OrderTransitionRuleError(decision.code)
    }

    const updated = await transaction.updateStatus({
      orderId: input.orderId,
      tenantId: order.tenantId,
      restaurantId: order.restaurantId,
      expectedStatus: order.status,
      nextStatus: input.nextStatus,
    })
    if (!updated) {
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
      },
    })

    return { status: input.nextStatus }
  })
}
