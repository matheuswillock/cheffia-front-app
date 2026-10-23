import { readFileSync } from "node:fs"

export function calculateLcovCoverage(lcov) {
  const lines = lcov
    .split(/\r?\n/)
    .filter((line) => line.startsWith("DA:"))
    .map((line) => Number(line.split(",")[1]))
  const covered = lines.filter((count) => count > 0).length
  return percentage(covered, lines.length)
}

export function calculateSummaryCoverage(summary) {
  return Number(summary?.total?.lines?.pct ?? 0)
}

export function calculateE2ECoverage(report) {
  const stats = report?.stats ?? {}
  const executed = Number(stats.expected ?? 0)
  const total =
    executed +
    Number(stats.unexpected ?? 0) +
    Number(stats.skipped ?? 0) +
    Number(stats.flaky ?? 0) +
    Number(stats.timedOut ?? 0)
  return percentage(executed, total)
}

export function formatCoverageSummary(sources, threshold) {
  const rows = sources.map(({ name, value }) => {
    const passed = value >= threshold
    return `| ${name} | ${value.toFixed(2)}% | ${threshold.toFixed(2)}% | ${passed ? "PASS" : "FAIL"} |`
  })
  return [
    "### Coverage gate",
    "",
    "| Layer | Coverage | Required | Result |",
    "| --- | ---: | ---: | --- |",
    ...rows,
    "",
  ].join("\n")
}

function percentage(covered, total) {
  if (!total) return 0
  return Number(((covered / total) * 100).toFixed(2))
}

function argument(name) {
  const prefix = `--${name}=`
  const value = process.argv.find((entry) => entry.startsWith(prefix))
  return value?.slice(prefix.length)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"))
}

if (import.meta.main) {
  const threshold = Number(argument("threshold") ?? 90)
  const sources = []
  if (argument("backend")) {
    sources.push({ name: "backend", value: calculateLcovCoverage(readFileSync(argument("backend"), "utf8")) })
  }
  if (argument("frontend")) {
    sources.push({ name: "frontend", value: calculateSummaryCoverage(readJson(argument("frontend"))) })
  }
  if (argument("e2e")) {
    sources.push({ name: "e2e", value: calculateE2ECoverage(readJson(argument("e2e"))) })
  }
  if (sources.length === 0) {
    console.error("Coverage gate requires at least one coverage input.")
    process.exitCode = 2
  } else {
    let failed = false
    const summary = formatCoverageSummary(sources, threshold)
    const summaryPath = process.env.GITHUB_STEP_SUMMARY
    if (summaryPath) {
      const { appendFileSync } = await import("node:fs")
      appendFileSync(summaryPath, `\n${summary}`)
    }
    for (const source of sources) {
      const result = `${source.value.toFixed(2)}%`
      console.log(`${source.name}: ${result} (minimum ${threshold.toFixed(2)}%)`)
      if (source.value < threshold) failed = true
    }

    if (failed) {
      console.error("Coverage gate failed: every selected test layer must reach the configured minimum.")
      process.exitCode = 1
    }
  }
}
