import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { LandingExperience } from "@/components/landing/LandingExperience"

describe("LandingExperience", () => {
  afterEach(cleanup)

  it("presents the factual table-to-kitchen journey", () => {
    render(<LandingExperience onJoinWaitlist={vi.fn()} onAskQuestion={vi.fn()} />)

    expect(
      screen.getByRole("heading", {
        name: "Pedidos à mesa em um fluxo digital que sua operação acompanha.",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("QR da mesa")).toBeInTheDocument()
    expect(screen.getByText("Cardápio no celular")).toBeInTheDocument()
    expect(screen.getByText("Cozinha recebe")).toBeInTheDocument()
    expect(screen.queryByText(/PIX|reservas|estoque em tempo real/i)).not.toBeInTheDocument()
  })

  it("opens the waitlist from the primary calls to action", () => {
    const onJoinWaitlist = vi.fn()
    render(<LandingExperience onJoinWaitlist={onJoinWaitlist} onAskQuestion={vi.fn()} />)

    fireEvent.click(
      screen.getAllByRole("button", { name: "Entrar na lista de espera" })[0],
    )

    expect(onJoinWaitlist).toHaveBeenCalledTimes(1)
  })

  it("reveals FAQ answers with accessible expanded state", () => {
    render(<LandingExperience onJoinWaitlist={vi.fn()} onAskQuestion={vi.fn()} />)

    const trigger = screen.getByRole("button", {
      name: "O cliente precisa instalar um aplicativo?",
    })

    expect(trigger).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(
      screen.getByText(/cardápio é acessado no navegador do celular/i),
    ).toBeVisible()
  })
})
