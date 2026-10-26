import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AuthForm } from "@/components/AuthContent/AuthForm"

afterEach(() => cleanup())

describe("AuthForm", () => {
  it("uses the documented Cheffia display and body families throughout the auth page", () => {
    render(<AuthForm initialMode="sign-in" onSignIn={vi.fn()} onSignUp={vi.fn()} />)

    expect(screen.getByRole("heading", { name: /Da mesa à cozinha/ })).toHaveClass("font-clash")
    expect(screen.getByRole("heading", { name: "Bem-vindo de volta" })).toHaveClass("font-clash")
  })

  it("uses the official Cheffia brand asset instead of a recreated mark", () => {
    render(<AuthForm initialMode="sign-in" onSignIn={vi.fn()} onSignUp={vi.fn()} />)

    expect(screen.getByRole("main")).toHaveClass("auth-page")
    const officialLogos = screen.getAllByRole("img", { name: "Marca Cheffia" })
    expect(officialLogos).toHaveLength(1)
    for (const logo of officialLogos) {
      expect(logo).toHaveAttribute("src", expect.stringContaining("logo-horizontal"))
    }
  })

  it("uses the Smooth UI dot-morph call to focus the auth form without an ornamental line", async () => {
    const user = userEvent.setup()
    render(<AuthForm initialMode="sign-in" onSignIn={vi.fn()} onSignUp={vi.fn()} />)

    const call = screen.getByRole("button", { name: "Feito para quem faz acontecer" })
    expect(call.querySelector('[data-slot="morph-dot"]')).toBeInTheDocument()
    expect(call.querySelector('.h-px')).not.toBeInTheDocument()
    expect(call).toHaveClass("self-start", "w-fit")
    await user.click(call)
    expect(screen.getByLabelText("Email")).toHaveFocus()
  })

  it("keeps both auth mode tabs readable and clearly marks the selected tab", () => {
    render(<AuthForm initialMode="sign-in" onSignIn={vi.fn()} onSignUp={vi.fn()} />)
    const tabs = within(screen.getByRole("group", { name: "Escolha entrar ou criar conta" }))
    const signInTab = tabs.getByRole("button", { name: "Entrar" })
    const signUpTab = tabs.getByRole("button", { name: "Criar conta" })

    expect(signInTab).toHaveAttribute("aria-pressed", "true")
    expect(signInTab).toHaveClass("font-semibold", "bg-primary/10")
    expect(signUpTab).toHaveAttribute("aria-pressed", "false")
    expect(signUpTab).toHaveClass("text-foreground-default/80")
  })

  it("moves the selected styling and pressed state when switching modes", async () => {
    const user = userEvent.setup()
    render(<AuthForm initialMode="sign-in" onSignIn={vi.fn()} onSignUp={vi.fn()} />)
    const tabs = within(screen.getByRole("group", { name: "Escolha entrar ou criar conta" }))
    const signInTab = tabs.getByRole("button", { name: "Entrar" })
    const signUpTab = tabs.getByRole("button", { name: "Criar conta" })

    await user.click(signUpTab)

    expect(signUpTab).toHaveAttribute("aria-pressed", "true")
    expect(signUpTab).toHaveClass("font-semibold", "bg-primary/10")
    expect(signInTab).toHaveAttribute("aria-pressed", "false")
    expect(signInTab).toHaveClass("text-foreground-default/80")
  })

  it("keeps the form focused on the existing content without decorative workflow graphics", () => {
    render(<AuthForm initialMode="sign-in" onSignIn={vi.fn()} onSignUp={vi.fn()} />)

    expect(screen.queryByRole("list", { name: "Fluxo do pedido no Cheffia" })).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Criar conta" })).toHaveLength(1)
  })

  it("uses the editorial photograph from the supplied Figma login frame", () => {
    render(<AuthForm initialMode="sign-in" onSignIn={vi.fn()} onSignUp={vi.fn()} />)

    expect(screen.getByRole("img", { name: "Chef finalizando pratos em uma cozinha" })).toHaveAttribute(
      "src",
      expect.stringContaining("auth-chef-plating"),
    )
  })

  it("keeps the outlined backstage badge over the photo without a sticky note", () => {
    render(<AuthForm initialMode="sign-in" onSignIn={vi.fn()} onSignUp={vi.fn()} />)

    const badge = screen.getByText("NOS BASTIDORES, TUDO SE CONECTA.")
    expect(badge).toHaveAttribute("data-slot", "badge")
    expect(badge).toHaveClass("font-inter", "text-xs")
    expect(badge).toHaveClass("bg-transparent")
    expect(badge).toHaveClass("absolute", "bottom-3", "right-3", "sm:bottom-4", "sm:right-4")
    expect(badge).not.toHaveClass("left-3", "top-3")
    expect(badge).not.toHaveClass("bg-background-black/85")
    expect(badge.closest("[data-tilt-depth]")).not.toBeInTheDocument()
    expect(screen.queryByRole("note", { name: "O ritmo da casa" })).not.toBeInTheDocument()
    expect(screen.queryByText("Cliente pede na mesa")).not.toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Chef finalizando pratos em uma cozinha" }).closest("figure")?.querySelector('img[src*="auth-paper-note"]')).not.toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Chef finalizando pratos em uma cozinha" }).closest("figure")?.parentElement).not.toHaveAttribute("style", expect.stringContaining("perspective"))
  })

  it("provides the Figma back-to-site navigation", () => {
    render(<AuthForm initialMode="sign-in" onSignIn={vi.fn()} onSignUp={vi.fn()} />)

    expect(screen.getByRole("link", { name: "Voltar ao site" })).toHaveAttribute("href", "/")
    expect(screen.getByRole("link", { name: "Voltar ao site" })).toHaveClass("hover:text-primary")
  })

  it("highlights future legal destinations without offering broken links", () => {
    render(<AuthForm initialMode="sign-up" onSignIn={vi.fn()} onSignUp={vi.fn()} />)

    for (const label of ["Termos de Serviço", "Política de Privacidade"]) {
      const title = screen.getByText(label)
      expect(title).toHaveClass("text-primary")
      expect(title.closest("a, button")).not.toBeInTheDocument()
      expect(screen.queryByRole("link", { name: label })).not.toBeInTheDocument()
    }
    expect(screen.getByText("Documentos ainda não disponíveis.")).toBeInTheDocument()
  })

  it("submits login credentials and does not expose Google authentication", async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn()

    render(<AuthForm initialMode="sign-in" onSignIn={onSignIn} onSignUp={vi.fn()} />)
    await user.type(screen.getByLabelText("Email"), "owner@cheffia.com")
    await user.type(screen.getByLabelText("Senha"), "SenhaSegura1!")
    await user.click(screen.getByRole("button", { name: "Entrar no app" }))

    expect(onSignIn).toHaveBeenCalledWith({ email: "owner@cheffia.com", password: "SenhaSegura1!" })
    expect(screen.queryByText(/google/i)).not.toBeInTheDocument()
  })

  it("switches to signup and validates matching passwords", async () => {
    const user = userEvent.setup()
    render(<AuthForm initialMode="sign-in" onSignIn={vi.fn()} onSignUp={vi.fn()} />)

    await user.click(within(screen.getByRole("group", { name: "Escolha entrar ou criar conta" })).getByRole("button", { name: "Criar conta" }))
    expect(screen.getByRole("heading", { name: "Crie sua conta" })).toBeInTheDocument()
    expect(screen.getByLabelText("Confirme sua senha")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Email"), "owner@cheffia.com")
    await user.type(screen.getByLabelText("Senha"), "SenhaSegura1!")
    await user.type(screen.getByLabelText("Confirme sua senha"), "outraSenha1!")
    await user.click(screen.getByRole("button", { name: "Criar minha conta" }))
    expect(screen.getByText("As senhas não conferem")).toBeInTheDocument()
    expect(screen.getByText("As senhas não conferem")).toHaveClass("bg-destructive", "text-destructive-foreground")
  })

  it("submits valid signup credentials", async () => {
    const user = userEvent.setup()
    const onSignUp = vi.fn()
    render(<AuthForm initialMode="sign-up" onSignIn={vi.fn()} onSignUp={onSignUp} />)
    await user.type(screen.getByLabelText("Email"), "owner@cheffia.com")
    await user.type(screen.getByLabelText("Senha"), "SenhaSegura1!")
    await user.type(screen.getByLabelText("Confirme sua senha"), "SenhaSegura1!")
    await user.click(screen.getByRole("button", { name: "Criar minha conta" }))

    expect(onSignUp).toHaveBeenCalledWith({ email: "owner@cheffia.com", password: "SenhaSegura1!" })
  })

  it.each([
    { mode: "sign-in" as const, submit: "Entrar no app", pending: "Entrando..." },
    { mode: "sign-up" as const, submit: "Criar minha conta", pending: "Criando conta..." },
  ])("keeps $mode pending with a merging loader inside the submit button", async ({ mode, submit, pending }) => {
    const user = userEvent.setup()
    let resolve!: () => void
    const action = vi.fn(() => new Promise<void>((done) => { resolve = done }))
    render(<AuthForm initialMode={mode} onSignIn={action} onSignUp={action} />)
    await user.type(screen.getByLabelText("Email"), "owner@cheffia.com")
    await user.type(screen.getByLabelText("Senha"), "SenhaSegura1!")
    if (mode === "sign-up") await user.type(screen.getByLabelText("Confirme sua senha"), "SenhaSegura1!")
    await user.click(screen.getByRole("button", { name: submit }))

    const button = screen.getByRole("button", { name: pending })
    expect(button).toBeDisabled()
    expect(button.querySelector('[data-slot="gooey-loader"]')).toBeInTheDocument()
    await user.click(button)
    expect(action).toHaveBeenCalledTimes(1)

    resolve()
    await waitFor(() => expect(screen.getByRole("button", { name: submit })).toBeEnabled())
  })

  it("does not submit an invalid email and explains how to correct it", async () => {
    const user = userEvent.setup()
    const onSignIn = vi.fn()
    render(<AuthForm initialMode="sign-in" onSignIn={onSignIn} onSignUp={vi.fn()} />)
    await user.type(screen.getByLabelText("Email"), "email-invalido")
    await user.type(screen.getByLabelText("Senha"), "SenhaSegura1!")
    await user.click(screen.getByRole("button", { name: "Entrar no app" }))

    expect(onSignIn).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent("Digite um email válido")
  })

  it("validates fields as they are filled and keeps backend actions untouched", async () => {
    const user = userEvent.setup()
    const onSignUp = vi.fn()
    render(<AuthForm initialMode="sign-up" onSignIn={vi.fn()} onSignUp={onSignUp} />)

    await user.type(screen.getByLabelText("Email"), "email-invalido")
    expect(await screen.findByText("Digite um email válido")).toBeInTheDocument()
    expect(onSignUp).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText("Email"))
    await user.type(screen.getByLabelText("Email"), "dono@restaurante.com")
    await user.type(screen.getByLabelText("Senha"), "123")
    expect(await screen.findByText("A senha deve ter no mínimo 8 caracteres")).toBeInTheDocument()
    expect(onSignUp).not.toHaveBeenCalled()
  })

  it("shows a safe, recoverable error when authentication fails", async () => {
    const user = userEvent.setup()
    render(<AuthForm initialMode="sign-in" onSignIn={vi.fn().mockRejectedValue(Object.assign(new Error("internal details"), { code: "invalid_credentials" }))} onSignUp={vi.fn()} />)
    await user.type(screen.getByLabelText("Email"), "owner@cheffia.com")
    await user.type(screen.getByLabelText("Senha"), "SenhaSegura1!")
    await user.click(screen.getByRole("button", { name: "Entrar no app" }))

    expect(await screen.findByText("Email ou senha incorretos. Confira seus dados ou redefina sua senha.")).toBeInTheDocument()
    expect(screen.getByText("Email ou senha incorretos. Confira seus dados ou redefina sua senha.")).toHaveClass("bg-destructive", "text-destructive-foreground")
    expect(screen.queryByText("internal details")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Entrar no app" })).toBeEnabled()
  })
})
