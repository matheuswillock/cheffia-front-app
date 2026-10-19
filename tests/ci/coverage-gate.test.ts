import { expect, test } from "bun:test"

import {
  calculateE2ECoverage,
  calculateLcovCoverage,
  calculateSummaryCoverage,
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
