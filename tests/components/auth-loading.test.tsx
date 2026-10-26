import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import AuthLoading from "@/app/(auth-pages)/loading"

describe("auth route loading", () => {
  it("shows a named busy state with Smooth UI skeletons for the form", () => {
    render(<AuthLoading />)

    expect(screen.getByRole("status", { name: "Carregando acesso" })).toHaveAttribute("aria-busy", "true")
    expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(8)
    expect(screen.queryByRole("button", { name: /entrar no app|criar minha conta/i })).not.toBeInTheDocument()
  })
})
