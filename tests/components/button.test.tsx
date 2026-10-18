import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("exposes an accessible name and invokes the click handler", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Salvar</Button>)

    const button = screen.getByRole("button", { name: "Salvar" })
    await user.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
