import { renderBaseTemplate } from "./base";
import type { WelcomeEmailInput } from "../types";

export const renderWelcomeTemplate = (input: WelcomeEmailInput) =>
  renderBaseTemplate({
    subject: "Seu restaurante entrou na Cheffia",
    preheader: "Seu onboarding minimo foi concluido e a operacao ja pode continuar.",
    heading: "Restaurante cadastrado",
    intro: `Ola, ${input.userName}.`,
    body: [
      `O restaurante ${input.restaurantName} ja foi registrado com sucesso na Cheffia.`,
      "A partir daqui voce pode acessar o painel, revisar os dados operacionais e seguir com a configuracao do restaurante.",
    ],
    ctaLabel: "Abrir painel",
    ctaUrl: input.dashboardUrl,
    outro: "Se este cadastro foi feito durante um teste, confira se o ambiente esta em EMAIL_TEST_MODE para evitar disparos indevidos.",
  });
