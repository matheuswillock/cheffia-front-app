import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const stylesheet = readFileSync("src/components/AuthContent/auth-form-a11y.css", "utf8")

describe("auth form accessibility stylesheet", () => {
  it("keeps auth copy readable and legal text at least 12px", () => {
    expect(stylesheet).toMatch(/\.auth-page\s+[^{}]*\{[\s\S]*?color:\s*hsl\(var\(--muted-foreground\)\)/)
    expect(stylesheet).toMatch(/\.auth-page\s+[^{}]*\{[\s\S]*?font-size:\s*12px/)
  })

  it("scopes every rule to the auth page without changing focus styles", () => {
    const selectors = [...stylesheet.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{/g)].map(([, selector]) => selector.trim())
    expect(selectors.length).toBeGreaterThan(0)
    expect(selectors.every((selector) => selector.startsWith(".auth-page"))).toBe(true)
    expect(stylesheet).not.toMatch(/:focus(?:-visible)?\s*\{/)
  })
})
