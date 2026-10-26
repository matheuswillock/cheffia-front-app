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

function parseLcovRecords(lcov) {
  const records = []
  let current
  for (const line of lcov.split(/\r?\n/)) {
    if (line.startsWith("SF:")) {
      current = { file: line.slice(3), total: 0, covered: 0, uncoveredLines: [] }
      records.push(current)
    } else if (current && line.startsWith("DA:")) {
      const [lineNumber, count] = line.slice(3).split(",").map(Number)
      current.total += 1
      if (count > 0) current.covered += 1
      else current.uncoveredLines.push(lineNumber)
    }
  }
  return records
}

export function formatCoverageDetails({ backendLcov, frontendSummary, threshold }) {
  const rows = [
    "### Coverage gaps by file",
    "",
    "| Layer | File | Lines covered | Coverage | Missing executable lines |",
    "| --- | --- | ---: | ---: | --- |",
  ]

  for (const record of parseLcovRecords(backendLcov ?? "")) {
    const value = percentage(record.covered, record.total)
    if (value < threshold) {
      rows.push(`| backend | ${record.file} | ${record.covered}/${record.total} | ${value.toFixed(2)}% | ${record.uncoveredLines.join(", ")} |`)
    }
  }

  for (const [file, summary] of Object.entries(frontendSummary ?? {})) {
    if (file === "total") continue
    const lines = summary?.lines
    if (!lines || Number(lines.pct) >= threshold) continue
    rows.push(`| frontend | ${file} | ${lines.covered}/${lines.total} | ${Number(lines.pct).toFixed(2)}% | coverage tool does not provide line numbers in summary |`)
  }

  if (rows.length === 4) rows.push("| — | No file is below the configured threshold | — | — | — |")
  return `${rows.join("\n")}\n`
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
    if (process.argv.includes("--details")) {
      const details = formatCoverageDetails({
        backendLcov: argument("backend") ? readFileSync(argument("backend"), "utf8") : "",
        frontendSummary: argument("frontend") ? readJson(argument("frontend")) : {},
        threshold,
      })
      console.log(details)
      const summaryPath = process.env.GITHUB_STEP_SUMMARY
      if (summaryPath) {
        const { appendFileSync } = await import("node:fs")
        appendFileSync(summaryPath, `\n${details}`)
      }
    }
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
