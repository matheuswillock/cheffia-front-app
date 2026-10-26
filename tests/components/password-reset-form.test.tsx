import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PasswordResetForm } from "@/components/AuthContent/PasswordResetForm"

afterEach(() => cleanup())

describe("PasswordResetForm", () => {
  it("validates password requirements and confirmation before updating", async () => {
    const user = userEvent.setup()
    const onPasswordUpdate = vi.fn()
    render(<PasswordResetForm onPasswordUpdate={onPasswordUpdate} />)

    await user.type(screen.getByLabelText("Nova senha"), "weak")
    await user.type(screen.getByLabelText("Confirme a nova senha"), "different")
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }))

    expect(onPasswordUpdate).not.toHaveBeenCalled()
    expect(await screen.findByText("A senha deve ter no mínimo 8 caracteres")).toBeInTheDocument()
    expect(screen.getByText("As senhas não conferem")).toBeInTheDocument()
  })

  it("shows success after updating the password", async () => {
    const user = userEvent.setup()
    const onPasswordUpdate = vi.fn().mockResolvedValue({ success: true })
    render(<PasswordResetForm onPasswordUpdate={onPasswordUpdate} />)

    await user.type(screen.getByLabelText("Nova senha"), "SenhaSegura1!")
    await user.type(screen.getByLabelText("Confirme a nova senha"), "SenhaSegura1!")
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }))

    expect(onPasswordUpdate).toHaveBeenCalledWith(expect.any(FormData))
    expect(await screen.findByRole("status")).toHaveTextContent("Sua senha foi atualizada")
  })

  it("explains when the recovery link is no longer valid", async () => {
    const user = userEvent.setup()
    const onPasswordUpdate = vi.fn().mockResolvedValue({ success: false, error: "invalid-or-expired-link" })
    render(<PasswordResetForm onPasswordUpdate={onPasswordUpdate} />)

    await user.type(screen.getByLabelText("Nova senha"), "SenhaSegura1!")
    await user.type(screen.getByLabelText("Confirme a nova senha"), "SenhaSegura1!")
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }))

    expect(await screen.findByText("Este link de recuperação expirou ou já foi usado. Solicite um novo link e tente novamente.")).toBeInTheDocument()
  })
})
