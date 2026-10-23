import { appendFileSync, writeFileSync } from "node:fs"

const CODE_FAILURE_STEPS = new Set([
  "prismaValidate",
  "typecheck",
  "unitTests",
  "componentTests",
  "backendCoverage",
  "frontendCoverage",
  "e2eTests",
  "coverageGate",
  "lint",
  "build",
])

export function classifyJobOutcome(result, stepOutcomes = {}) {
  if (result === "success") return "passed"
  if (result === "cancelled" || result === "skipped") return "cancelled_or_skipped"
  if (result !== "failure") return "infrastructure_failure"
  return Object.entries(stepOutcomes).some(
    ([name, outcome]) => CODE_FAILURE_STEPS.has(name) && outcome?.conclusion === "failure",
  )
    ? "code_failure"
    : "infrastructure_failure"
}

export function aggregateQualityOutcomes(outcomes) {
  if (outcomes.some((outcome) => !["passed", "code_failure", "infrastructure_failure", "cancelled_or_skipped"].includes(outcome))) {
    return "infrastructure_failure"
  }
  if (outcomes.includes("code_failure")) return "code_failure"
  if (outcomes.includes("infrastructure_failure")) return "infrastructure_failure"
  if (outcomes.includes("cancelled_or_skipped")) return "cancelled_or_skipped"
  return "passed"
}

function cli() {
  const mode = process.argv[2]
  if (mode === "--classify-job") {
    const outcome = classifyJobOutcome(process.env.JOB_RESULT, JSON.parse(process.env.STEP_OUTCOMES ?? "{}"))
    writeFileSync(process.env.GITHUB_OUTPUT, `outcome=${outcome}\n`)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\nQuality job result: **${outcome}**\n`)
    if (outcome !== "passed") process.exitCode = 1
    return
  }
  if (mode === "--aggregate") {
    const outcomes = JSON.parse(process.env.QUALITY_OUTCOMES ?? "[]")
    const results = JSON.parse(process.env.QUALITY_JOB_RESULTS ?? "[]")
    const normalized = outcomes.map((value, index) =>
      value || (["cancelled", "skipped"].includes(results[index]) ? "cancelled_or_skipped" : "infrastructure_failure"),
    )
    const outcome = aggregateQualityOutcomes(normalized)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n## Quality gates: ${outcome}\n`)
    if (outcome !== "passed") {
      console.error(`Quality gates did not pass: ${outcome}`)
      process.exitCode = 1
    }
    return
  }
  console.error("Usage: quality-gate.mjs --classify-job | --aggregate")
  process.exitCode = 2
}

if (import.meta.main) cli()
