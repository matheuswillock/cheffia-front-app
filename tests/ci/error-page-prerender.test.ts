import { expect, test } from "bun:test"

const errorPage = await Bun.file(
  new URL("../../src/app/error/page.tsx", import.meta.url),
).text()

test("the error route reads search parameters inside a Suspense boundary", () => {
  expect(errorPage).toMatch(
    /function ErrorContent\(\)[\s\S]*useSearchParams\(\)/,
  )
  expect(errorPage).toMatch(
    /<Suspense[^>]*>[\s\S]*<ErrorContent\s*\/>[\s\S]*<\/Suspense>/,
  )
})
