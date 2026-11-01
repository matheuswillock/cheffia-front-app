import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SubscriptionManager } from "@/components/Billing/SubscriptionManager"

const PROPS = { restaurantSlug: "demo", tenantId: "t1", restaurantId: "r1" }

function mockStatus(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("SubscriptionManager", () => {
  it("shows the three plan cards with Assinar buttons when there is no subscription", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockStatus({ hasSubscription: false }))
    render(<SubscriptionManager {...PROPS} />)
    const buttons = await screen.findAllByRole("button", { name: "Assinar" })
    expect(buttons).toHaveLength(3)
    expect(screen.getByText("Básico")).toBeInTheDocument()
    expect(screen.getByText("Pro")).toBeInTheDocument()
    expect(screen.getByText("Completo")).toBeInTheDocument()
  })

  it("shows current plan name and Gerenciar assinatura button when active", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockStatus({ hasSubscription: true, plan: "pro", status: "active", currentPeriodEnd: "2027-01-01" }),
    )
    render(<SubscriptionManager {...PROPS} />)
    expect(await screen.findByText("Plano Pro")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Gerenciar assinatura" })).toBeInTheDocument()
  })

  it("shows Pagamento pendente when subscription is past_due", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockStatus({ hasSubscription: true, plan: "basic", status: "past_due" }),
    )
    render(<SubscriptionManager {...PROPS} />)
    expect(await screen.findByText("Pagamento pendente")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Atualizar pagamento" })).toBeInTheDocument()
  })

  it("shows Assinatura encerrada when subscription is canceled", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockStatus({ hasSubscription: true, plan: "basic", status: "canceled", cancelAtPeriodEnd: false }),
    )
    render(<SubscriptionManager {...PROPS} />)
    expect(await screen.findByText(/Assinatura encerrada/i)).toBeInTheDocument()
  })

  it("calls checkout endpoint with plan: basic when Assinar is clicked", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockStatus({ hasSubscription: false }))
      .mockResolvedValueOnce(mockStatus({ url: "https://checkout.stripe.com/test" }))

    const origLocation = window.location
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true, configurable: true })

    const user = userEvent.setup()
    render(<SubscriptionManager {...PROPS} />)
    const buttons = await screen.findAllByRole("button", { name: "Assinar" })
    await user.click(buttons[0])

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/internal/stripe/checkout",
        expect.objectContaining({ method: "POST" }),
      ),
    )

    Object.defineProperty(window, "location", { value: origLocation, writable: true, configurable: true })
  })

  it("calls portal endpoint on Gerenciar assinatura click", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockStatus({ hasSubscription: true, plan: "pro", status: "active" }))
      .mockResolvedValueOnce(mockStatus({ url: "https://billing.stripe.com/portal" }))

    const origLocation = window.location
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true, configurable: true })

    const user = userEvent.setup()
    render(<SubscriptionManager {...PROPS} />)
    const btn = await screen.findByRole("button", { name: "Gerenciar assinatura" })
    await user.click(btn)

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/internal/stripe/portal",
        expect.objectContaining({ method: "POST" }),
      ),
    )

    Object.defineProperty(window, "location", { value: origLocation, writable: true, configurable: true })
  })

  it("shows a loading indicator while the status is being fetched", () => {
    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(new Promise(() => {}))
    render(<SubscriptionManager {...PROPS} />)
    expect(screen.getByText("Carregando...")).toBeInTheDocument()
  })

  it("shows an error message when the status API fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 500 }))
    render(<SubscriptionManager {...PROPS} />)
    expect(await screen.findByText(/Erro ao carregar/i)).toBeInTheDocument()
  })
})
