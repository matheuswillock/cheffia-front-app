import { describe, expect, test } from "bun:test"
import { getAuthErrorMessage } from "../../src/business/auth/error-message"

describe("getAuthErrorMessage", () => {
  test("offers a password reset hint for invalid credentials without revealing account existence", () => {
    expect(getAuthErrorMessage({ code: "invalid_credentials" })).toBe(
      "Email ou senha incorretos. Confira seus dados ou redefina sua senha.",
    )
  })

  test("maps email confirmation errors to an actionable message", () => {
    expect(getAuthErrorMessage({ code: "email_not_confirmed" })).toBe(
      "Confirme seu email para continuar. Verifique sua caixa de entrada e spam.",
    )
  })

  test("does not expose whether a sign-up email already exists", () => {
    expect(getAuthErrorMessage({ code: "email_exists" }, "sign-up")).toBe(
      "Não foi possível criar a conta com esses dados. Confira o email ou tente entrar.",
    )
  })

  test("maps rate limits and network failures without exposing provider text", () => {
    expect(getAuthErrorMessage({ status: 429, message: "private provider details" })).toBe(
      "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
    )
    expect(getAuthErrorMessage({ message: "Failed to fetch: internal host" })).toBe(
      "Não foi possível conectar. Verifique sua internet e tente novamente.",
    )
  })

  test("uses a safe generic message for unknown errors and recovery", () => {
    expect(getAuthErrorMessage({ message: "secret server stack" })).toBe(
      "Não foi possível concluir a solicitação. Confira seus dados e tente novamente.",
    )
    expect(getAuthErrorMessage({ code: "user_not_found" }, "recovery")).toBe(
      "Se os dados estiverem corretos, você poderá continuar com a recuperação da conta.",
    )
  })
})
