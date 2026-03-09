import { renderBaseTemplate } from "./base";
import type { EmailConfirmationInput } from "../types";

export const renderEmailConfirmationTemplate = (input: EmailConfirmationInput) =>
  renderBaseTemplate({
    subject: "Confirme seu e-mail na Cheffia",
    preheader: "Confirme o endereco para liberar os proximos passos do onboarding.",
    heading: "Confirme seu e-mail",
    intro: `Ola, ${input.userName}.`,
    body: [
      "Precisamos confirmar que este endereco de e-mail pertence a voce.",
      "Depois da confirmacao, a Cheffia passa a tratar o estado do seu e-mail pelo Supabase Auth como fonte de verdade.",
    ],
    ctaLabel: "Confirmar e continuar",
    ctaUrl: input.confirmationUrl,
    outro: "Se voce nao reconhece este cadastro, ignore esta mensagem.",
  });
