import { renderToString } from "react-dom/server"
import { afterEach, expect, it, vi } from "vitest"

import { PublicOrderingFlow } from "@/components/Ordering/PublicOrderingFlow"

afterEach(() => vi.unstubAllGlobals())

it("does not access browser globals while rendering on the server", () => {
  vi.stubGlobal("window", undefined)

  expect(() => renderToString(<PublicOrderingFlow restaurantSlug="demo" />)).not.toThrow()
})
