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
  const sources = [
    {
      name: "backend",
      value: calculateLcovCoverage(readFileSync(argument("backend"), "utf8")),
    },
    {
      name: "frontend",
      value: calculateSummaryCoverage(readJson(argument("frontend"))),
    },
    {
      name: "e2e",
      value: calculateE2ECoverage(readJson(argument("e2e"))),
    },
  ]

  let failed = false
  for (const source of sources) {
    const result = `${source.value.toFixed(2)}%`
    console.log(`${source.name}: ${result} (minimum ${threshold.toFixed(2)}%)`)
    if (source.value < threshold) failed = true
  }

  if (failed) {
    console.error("Coverage gate failed: every backend, frontend and E2E layer must reach 90%.")
    process.exitCode = 1
  }
}
