import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Button } from "@/components/ui/button"

afterEach(() => cleanup())

describe("Button loading state", () => {
  it("renders the reusable merging loader and prevents another click while loading", () => {
    const onClick = vi.fn()
    render(<Button loading loadingLabel="Salvando..." onClick={onClick}>Salvar</Button>)

    const button = screen.getByRole("button", { name: "Salvando..." })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")
    expect(button.querySelector('[data-slot="gooey-loader"]')).toBeInTheDocument()
    expect(button.querySelector('filter feGaussianBlur')).toBeInTheDocument()
    expect(onClick).not.toHaveBeenCalled()
  })

  it("keeps its original label and behavior when not loading", () => {
    render(<Button>Salvar</Button>)
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled()
    expect(document.querySelector('[data-slot="gooey-loader"]')).not.toBeInTheDocument()
  })

  it("exposes the same loading indicator and blocks navigation for a slotted link", () => {
    render(<Button asChild loading loadingLabel="Abrindo..."><a href="/app">Abrir app</a></Button>)
    const link = screen.getByRole("link", { name: "Abrindo..." })
    expect(link).toHaveAttribute("aria-disabled", "true")
    expect(link.querySelector('[data-slot="gooey-loader"]')).toBeInTheDocument()
    expect(fireEvent.click(link)).toBe(false)
  })
})
