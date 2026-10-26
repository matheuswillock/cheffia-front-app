import { expect, test } from "bun:test"

import {
  calculateE2ECoverage,
  calculateLcovCoverage,
  calculateSummaryCoverage,
  formatCoverageDetails,
} from "../../scripts/coverage-gate.mjs"

test("calculates backend LCOV coverage", () => {
  expect(calculateLcovCoverage("DA:1,1\nDA:2,0\nDA:3,1\n")).toBe(66.67)
})

test("calculates frontend summary coverage", () => {
  expect(calculateSummaryCoverage({ total: { lines: { pct: 91.25 } } })).toBe(91.25)
})

test("calculates E2E executed-test coverage including skipped tests", () => {
  expect(
    calculateE2ECoverage({ stats: { expected: 9, unexpected: 0, skipped: 1, flaky: 0, timedOut: 0 } }),
  ).toBe(90)
})

test("formats a coverage summary that identifies each layer and its gate result", async () => {
  const coverageGate = await import("../../scripts/coverage-gate.mjs")
  expect(typeof coverageGate.formatCoverageSummary).toBe("function")
  if (typeof coverageGate.formatCoverageSummary !== "function") return

  expect(coverageGate.formatCoverageSummary(
      [
        { name: "backend", value: 92.21 },
        { name: "frontend", value: 89.99 },
        { name: "e2e", value: 100 },
      ],
      90,
  )).toContain("| frontend | 89.99% | 90.00% | FAIL |")
})

test("formats exact per-file coverage gaps for backend and frontend", () => {
  const details = formatCoverageDetails({
    backendLcov: "SF:src/a.ts\nDA:10,1\nDA:11,0\nDA:12,0\nLF:3\nLH:1\nend_of_record\n",
    frontendSummary: {
      "src/B.tsx": { lines: { total: 4, covered: 3, pct: 75 } },
      "src/C.tsx": { lines: { total: 2, covered: 2, pct: 100 } },
    },
    threshold: 90,
  })

  expect(details).toContain("src/a.ts")
  expect(details).toContain("11, 12")
  expect(details).toContain("src/B.tsx")
  expect(details).toContain("3/4")
  expect(details).not.toContain("src/C.tsx")
})
