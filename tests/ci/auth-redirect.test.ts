import { expect, test } from "bun:test"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"

test("Next redirect errors are recognized as control flow, not authentication failures", () => {
  let caught: unknown
  try {
    redirect("/dashboard")
  } catch (error) {
    caught = error
  }

  expect(isRedirectError(caught)).toBe(true)
})
