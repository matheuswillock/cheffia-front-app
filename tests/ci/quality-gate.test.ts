import { expect, test } from "bun:test"

test("classifies failed steps as code, infrastructure, or incomplete execution", async () => {
  const moduleUrl = new URL("../../scripts/ci/quality-gate.mjs", import.meta.url)
  expect(await Bun.file(moduleUrl).exists()).toBe(true)
  if (!(await Bun.file(moduleUrl).exists())) return

  const { classifyJobOutcome } = await import("../../scripts/ci/quality-gate.mjs")
  expect(classifyJobOutcome("success", {})).toBe("passed")
  expect(classifyJobOutcome("failure", { unitTests: { conclusion: "failure" } })).toBe("code_failure")
  expect(classifyJobOutcome("failure", { setupDeps: { conclusion: "failure" } })).toBe("infrastructure_failure")
  expect(classifyJobOutcome("failure", {})).toBe("infrastructure_failure")
  expect(classifyJobOutcome("cancelled", {})).toBe("cancelled_or_skipped")
  expect(classifyJobOutcome("skipped", {})).toBe("cancelled_or_skipped")
})

test("aggregates quality outcomes with actionable, distinct verdicts", async () => {
  const moduleUrl = new URL("../../scripts/ci/quality-gate.mjs", import.meta.url)
  if (!(await Bun.file(moduleUrl).exists())) return
  const { aggregateQualityOutcomes } = await import("../../scripts/ci/quality-gate.mjs")

  expect(aggregateQualityOutcomes(["passed", "passed"])).toBe("passed")
  expect(aggregateQualityOutcomes(["code_failure", "passed"])).toBe("code_failure")
  expect(aggregateQualityOutcomes(["infrastructure_failure", "passed"])).toBe("infrastructure_failure")
  expect(aggregateQualityOutcomes(["passed", "cancelled_or_skipped"])).toBe("cancelled_or_skipped")
  expect(aggregateQualityOutcomes(["passed", ""])).toBe("infrastructure_failure")
})
