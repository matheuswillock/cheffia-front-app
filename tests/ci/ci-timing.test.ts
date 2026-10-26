import { expect, test } from "bun:test"

import { measureCiStage } from "../../scripts/lib/ci-timing.mjs"

test("does not fail a quality command when the GitHub summary is unavailable", async () => {
  const previous = process.env.GITHUB_STEP_SUMMARY
  process.env.GITHUB_STEP_SUMMARY = "/proc/cheffia-summary-that-does-not-exist"
  try {
    await expect(measureCiStage("local checks", async () => "ok")).resolves.toBe("ok")
  } finally {
    if (previous === undefined) delete process.env.GITHUB_STEP_SUMMARY
    else process.env.GITHUB_STEP_SUMMARY = previous
  }
})
