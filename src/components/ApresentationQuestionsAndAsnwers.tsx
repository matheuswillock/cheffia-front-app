"use client"

import Link from "next/link";
import Image from "next/image";
import OpenCardIcon from "../../public/assets/Icons/icon-open-card.svg"
import { useState } from "react";

export default function ApresentationQuestionsAndAsnwers() {
  const [openCardIndex, setOpenCardIndex] = useState<number | null>(null);

  const itemsQA = [
    {
      question: "Como funciona a Cheffia?",
      answer:
        "Simples: o cliente escaneia o QR Code, acessa o cardápio no celular, faz o pedido e paga ali mesmo. Você acompanha tudo em tempo real no seu painel: pedidos, estoque e atendimento — sem complicação.",
    },
    {
      question: "Vai substituir os garçons?",
      answer:
        "Nada disso. A Cheffia entra pra somar! Seu time foca no atendimento e na experiência do cliente, enquanto o sistema cuida dos pedidos e pagamentos com agilidade e sem erro.",
    },
    {
      question: "É difícil de usar?",
      answer:
        "Zero dificuldade. A gente te ajuda na configuração e treina sua equipe. O sistema é super intuitivo, pensado pra facilitar o dia a dia do seu restaurante.",
    },
    {
      question: "Quanto custa?",
      answer:
        "Temos planos acessíveis, ajustados ao porte do seu negócio. E o melhor: o investimento se paga rápido — com menos erros, menos desperdício e operação mais ágil.",
    },
    {
      question: "Já uso outro sistema. A Cheffia funciona junto?",
      answer:
        "Funciona, sim! Nossa solução pode integrar com o sistema que você já usa. Mas se preferir, também oferecemos uma solução completa, tudo em um só lugar.",
    },
    {
      question: "Ajuda a reduzir desperdício?",
      answer:
        "Com certeza. Você evita erro nos pedidos, controla o estoque em tempo real e ajusta o cardápio com base na demanda. Resultado? Menos desperdício, mais lucro.",
    },
    {
      question: "Os clientes vão se adaptar?",
      answer:
        "Vão e já estão! A maioria prefere autonomia e agilidade. A Cheffia é fácil de usar, direta no celular e sem complicação pra ninguém.",
    },
    {
      question: "E o pagamento?",
      answer:
        "Rápido e sem filas. O cliente paga pelo celular com PIX, cartão ou outros meios. Agiliza o atendimento e aumenta a rotatividade das mesas.",
    },
    {
      question: "E se eu precisar de ajuda?",
      answer:
        "Pode contar com a gente. Suporte rápido e eficiente, sempre que você precisar. A gente resolve — sem enrolação.",
    },
  ];

  const toggleCard = (index: number) => {
    setOpenCardIndex(openCardIndex === index ? null : index);
  };

  return (
    <section className="bg-background-cardAdvantages rounded-3xl -mt-16 px-8 py-16 flex flex-col items-center gap-8 justify-center relative overflow-hidden z-10">
      <div className="flex flex-col items-center justify-center text-5xl leading-[44px]">
        <h2 className="font-medium">Dúvidas</h2>
        <h3 className="font-extralight">frequentes</h3>

        <p className="font-normal font-inter text-sm leading-4 mt-4">
          Não encontrou a resposta para a sua dúvida aqui?
        </p>
      </div>

      <Link href="">
        <button
          className="
              bg-button 
              text-foreground-black 
              mt-
              px-4
              h-8
              text-sm
              leading-4
              font-medium
              font-inter 
              rounded-full 
              shadow-md 
              hover:bg-button-dark 
              transition"
        >
          Faça uma pergunta
        </button>
      </Link>

      {/* TODO: QUANDO clicar no card alterar o bg para bg-background-green/10 */}
      <div className="flex items-center justify-center flex-col gap-4 w-full mb-6">
        {itemsQA.map((item, index) => (
          <div
            key={index}
            onClick={() => toggleCard(index)}
            className="w-72 bg-background-QA2 px-3 py-4 rounded-lg flex items-center justify-between flex-col gap-4 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full flex-row gap-2">
              <p className="font-inter text-foreground-pureWhite font-medium text-base leading-4">
                {item.question}
              </p>

              <Image
                src={OpenCardIcon}
                alt="Icone para abrir o card"
                width={20}
                height={20}
              />
            </div>

            {openCardIndex === index && (
              <p className="font-inter text-foreground-card font-medium text-sm leading-4">
                {item.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}