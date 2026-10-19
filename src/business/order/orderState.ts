export const orderStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "rejected",
  "cancelled",
] as const

export type OrderStatus = (typeof orderStatuses)[number]
export type OrderRole = "customer" | "owner" | "kitchen" | "manager" | "waiter"

type TransitionActor = {
  role: OrderRole
  reason?: string
}

type TransitionResult =
  | { ok: true }
  | {
      ok: false
      code: "ORDER_TRANSITION_NOT_ALLOWED" | "ORDER_REJECTION_REASON_REQUIRED"
    }

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["preparing", "rejected", "cancelled"],
  preparing: ["ready"],
  ready: ["delivered"],
  delivered: [],
  rejected: [],
  cancelled: [],
}

function canTransition(role: OrderRole, from: OrderStatus, to: OrderStatus) {
  if (to === "cancelled") {
    return role === "customer" && (from === "pending" || from === "confirmed")
  }

  if (to === "rejected") {
    return role === "kitchen" || role === "manager"
  }

  if (role === "customer") {
    return false
  }

  return role === "kitchen" || role === "manager" || role === "waiter"
}

export function transitionOrder(
  from: OrderStatus,
  to: OrderStatus,
  actor: TransitionActor,
): TransitionResult {
  if (to === "rejected" && !actor.reason?.trim()) {
    return { ok: false, code: "ORDER_REJECTION_REASON_REQUIRED" }
  }

  if (!allowedTransitions[from].includes(to) || !canTransition(actor.role, from, to)) {
    return { ok: false, code: "ORDER_TRANSITION_NOT_ALLOWED" }
  }

  return { ok: true }
}
