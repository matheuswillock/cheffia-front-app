import { expect, test } from "bun:test"
import { spawnSync } from "node:child_process"

test("Next redirect errors are recognized as control flow, not authentication failures", () => {
  const result = spawnSync("bun", ["-e", `
    import { redirect } from "next/navigation"
    import { isRedirectError } from "next/dist/client/components/redirect-error"
    try {
      redirect("/dashboard")
    } catch (error) {
      if (isRedirectError(error)) process.exit(0)
    }
    process.exit(1)
  `], { encoding: "utf8" })

  expect(result.status).toBe(0)
})
