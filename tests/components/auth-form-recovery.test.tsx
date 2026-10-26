import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AuthForm } from "@/components/AuthContent/AuthForm"

afterEach(() => cleanup())

describe("AuthForm password recovery", () => {
  it("lets a user request password recovery and uses account-enumeration-safe confirmation", async () => {
    const user = userEvent.setup()
    const onRequestPasswordReset = vi.fn().mockResolvedValue(undefined)
    render(
      <AuthForm
        initialMode="sign-in"
        onSignIn={vi.fn()}
        onSignUp={vi.fn()}
        onRequestPasswordReset={onRequestPasswordReset}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Esqueceu sua senha?" }))
    expect(screen.getByRole("heading", { name: "Recuperar senha" })).toBeInTheDocument()
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument()
    await user.type(screen.getByLabelText("Email"), "owner@cheffia.com")
    await user.click(screen.getByRole("button", { name: "Enviar instruções" }))

    expect(onRequestPasswordReset).toHaveBeenCalledWith("owner@cheffia.com")
    expect(await screen.findByText(/se houver uma conta associada a esse email/i)).toBeInTheDocument()
  })

  it("does not request recovery for an invalid email", async () => {
    const user = userEvent.setup()
    const onRequestPasswordReset = vi.fn()
    render(
      <AuthForm
        initialMode="sign-in"
        onSignIn={vi.fn()}
        onSignUp={vi.fn()}
        onRequestPasswordReset={onRequestPasswordReset}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Esqueceu sua senha?" }))
    await user.type(screen.getByLabelText("Email"), "nao-e-email")
    await user.click(screen.getByRole("button", { name: "Enviar instruções" }))

    expect(onRequestPasswordReset).not.toHaveBeenCalled()
    expect(await screen.findByText("Digite um email válido")).toBeInTheDocument()
  })
})
