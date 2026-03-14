import { renderBaseTemplate } from "./base";
import type { PasswordResetEmailInput } from "../types";

export const renderPasswordResetTemplate = (input: PasswordResetEmailInput) =>
  renderBaseTemplate({
    subject: "Redefinicao de senha da Cheffia",
    preheader: "Use o link para criar uma nova senha com seguranca.",
    heading: "Redefina sua senha",
    intro: `Ola, ${input.userName}.`,
    body: [
      "Recebemos uma solicitacao para redefinir a senha da sua conta.",
      "Se foi voce quem pediu essa alteracao, use o botao abaixo para continuar.",
      "Se voce nao solicitou essa troca, ignore este e-mail. Sua senha atual continuara valida.",
    ],
    ctaLabel: "Criar nova senha",
    ctaUrl: input.resetUrl,
    outro: "Por seguranca, este link deve ser usado apenas por voce e expira automaticamente.",
  });
