import { expect, test, describe } from "bun:test"
import { isSamePlanCycle } from "@/business/billing/createCheckoutSession"

const requested = { plan: "pro" as const, billingCycle: "monthly" as const }

describe("isSamePlanCycle", () => {
  test("returns true when plan and cycle match and status is active", () => {
    expect(isSamePlanCycle({ plan: "pro", billingCycle: "monthly", status: "active" }, requested)).toBe(true)
  })

  test("returns true when status is past_due", () => {
    expect(isSamePlanCycle({ plan: "pro", billingCycle: "monthly", status: "past_due" }, requested)).toBe(true)
  })

  test("returns false when plan is different", () => {
    expect(isSamePlanCycle({ plan: "basic", billingCycle: "monthly", status: "active" }, requested)).toBe(false)
  })

  test("returns false when billing cycle is different", () => {
    expect(isSamePlanCycle({ plan: "pro", billingCycle: "annual", status: "active" }, requested)).toBe(false)
  })

  test("returns false when existing subscription is null", () => {
    expect(isSamePlanCycle(null, requested)).toBe(false)
  })

  test("returns false when status is canceled", () => {
    expect(isSamePlanCycle({ plan: "pro", billingCycle: "monthly", status: "canceled" }, requested)).toBe(false)
  })

  test("returns false when status is incomplete", () => {
    expect(isSamePlanCycle({ plan: "pro", billingCycle: "monthly", status: "incomplete" }, requested)).toBe(false)
  })
})
