type AuthErrorLike = {
  code?: unknown
  status?: unknown
  message?: unknown
}

export type AuthErrorContext = "sign-in" | "sign-up" | "recovery"

const GENERIC_MESSAGE = "Não foi possível concluir a solicitação. Confira seus dados e tente novamente."

/** Converts untrusted Supabase auth errors into safe, actionable user-facing copy. */
export function getAuthErrorMessage(
  error: AuthErrorLike | null | undefined,
  context: AuthErrorContext = "sign-in",
): string {
  if (context === "recovery") {
    return "Se os dados estiverem corretos, você poderá continuar com a recuperação da conta."
  }

  const code = typeof error?.code === "string" ? error.code.toLowerCase() : ""
  const status = typeof error?.status === "number" ? error.status : Number(error?.status)
  const providerMessage = typeof error?.message === "string" ? error.message.toLowerCase() : ""

  if (status === 429 || code === "too_many_requests" || code === "over_request_rate_limit") {
    return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."
  }

  if (["email_not_confirmed", "email_address_not_confirmed"].includes(code)) {
    return "Confirme seu email para continuar. Verifique sua caixa de entrada e spam."
  }

  if (["invalid_credentials", "invalid_grant", "user_not_found", "email_not_found"].includes(code)) {
    return "Email ou senha incorretos. Confira seus dados ou redefina sua senha."
  }

  if (/network|fetch|offline|connection/.test(code) || /network|failed to fetch|offline|connection/.test(providerMessage)) {
    return "Não foi possível conectar. Verifique sua internet e tente novamente."
  }

  if (context === "sign-up" && ["user_already_exists", "email_exists"].includes(code)) {
    return "Não foi possível criar a conta com esses dados. Confira o email ou tente entrar."
  }

  return GENERIC_MESSAGE
}
