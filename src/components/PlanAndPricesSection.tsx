import Check from "../assets/check.svg";
import CheckInDefautlColor from "../assets/check-in-default-color.svg";
import { PlanAndPrices } from "./PlanAndPrices";

export function PlanAndPricesSection() {
  const cardPlanAndPrices = [
    {
      planTitle: "Básico",
      price: "R$ 99/mês",
      description: [
        "Até 100 pedidos/mês",
        "Suporte por email",
        "QR Code personalizado",
      ],
      icon: Check,
      isSelected: false,
    },
    {
      planTitle: "Profissional",
      price: "R$ 199/mês",
      description: [
        "Até 500 pedidos/mês",
        "Suporte prioritário",
        "Análise de dados básica",
      ],
      icon: CheckInDefautlColor,
      isSelected: true,
    },
    {
      planTitle: "Enterprise",
      price: "Personalizado",
      description: [
        "Pedidos ilimitados",
        "Suporte 24/7",
        "Análise de dados avançada",
      ],
      icon: Check,
      isSelected: false,
    },
  ];

    return (
      <section className="pricing py-20">
        <h2 className="text-3xl font-bold text-center mb-12 text-defaultForeground">
          Planos e Preços
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cardPlanAndPrices.map((card, index) => (
            <PlanAndPrices
              key={index}
              planTitle={card.planTitle}
              price={card.price}
              description={card.description}
              isSelected={card.isSelected}
              icon={card.icon}
            />
          ))}
        </div>
      </section>
    );
}
