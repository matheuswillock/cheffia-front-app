import { appendFileSync } from "node:fs"
import { performance } from "node:perf_hooks"

const initializedSummaries = new Set()

function appendTiming(stage, elapsedMs) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) return

  try {
    if (!initializedSummaries.has(summaryPath)) {
      appendFileSync(
        summaryPath,
        `\n### CI stage timings\n\n| Stage | Duration |\n| --- | ---: |\n`,
      )
      initializedSummaries.add(summaryPath)
    }
    appendFileSync(summaryPath, `| ${stage.replaceAll("|", "\\|")} | ${elapsedMs} ms |\n`)
  } catch (error) {
    console.warn(
      `Could not write CI timing summary: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export async function measureCiStage(stage, operation) {
  const startedAt = performance.now()
  try {
    return await operation()
  } finally {
    appendTiming(stage, Math.max(0, Math.round(performance.now() - startedAt)))
  }
}
