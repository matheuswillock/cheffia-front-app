"use client"

import Link from "next/link";
import Image from "next/image";
import OpenCardIcon from "../../public/assets/Icons/icon-open-card.svg"
import { useState } from "react";

interface ApresentationQuestionsAndAsnwersProps {
  setIsModalOpen: () => void;
}

export default function ApresentationQuestionsAndAsnwers({
  setIsModalOpen,
}: ApresentationQuestionsAndAsnwersProps) {
  const [openCardIndex, setOpenCardIndex] = useState<number | null>(null);

  const itemsQA = [
    {
      question: "Como funciona a Cheffia?",
      answer:
        "Simples: o cliente escaneia o QR Code, acessa o cardápio no celular, faz o pedido e paga ali mesmo. Você acompanha tudo em tempo real no seu painel: pedidos, estoque e atendimento, sem complicação.",
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
        "Temos planos acessíveis, ajustados ao porte do seu negócio. E o melhor: o investimento se paga rápido! Com menos erros, menos desperdício e operação mais ágil.",
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
        "Pode contar com a gente. Suporte rápido e eficiente, sempre que você precisar. A gente resolve para você.",
    },
  ];

  const toggleCard = (index: number) => {
    setOpenCardIndex(openCardIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="
        bg-background-cardAdvantages
        rounded-3xl
        -mt-16
        px-8
        py-16
        flex
        flex-col
        items-center
        gap-10 xl:gap-12
        justify-center
        relative
        overflow-hidden
        z-10
      "
    >
      <div className="flex flex-col items-center justify-center text-5xl leading-[44px] gap-2 lg:gap-4">
        <div className="flex flex-col md:flex-row md:gap-2 items-center justify-center text-5xl xl:text-6xl leading-[44px]">
          <h2 className="font-medium">Dúvidas</h2>
          <h3 className="font-extralight">frequentes</h3>
        </div>

        <p className="font-normal font-inter text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl leading-4">
          Não encontrou a resposta para a sua dúvida aqui?
        </p>
      </div>

      <button
        aria-label="Entrar na lista de espera"
        onClick={setIsModalOpen}
        type="button"
        className="
          bg-button
          text-foreground-aboutBlack
            px-6
            xl:px-8
            2xl:px-10
            h-9
            md:h-10
            xl:h-11
            2xl:h-12
            text-center
            text-base
            sm:text-lg
            lg:text-xl
            xl:text-[22px]
            2xl:text-2xl
            font-medium
            font-inter
            rounded-full
            shadow-md
            hover:bg-button-dark
            hover:text-foreground-pureWhite
            hover:shadow-lg
            active:bg-button-dark
            transition
            duration-300
            ease-in-out
          "
      >
        Faça uma pergunta
      </button>

      <div className="flex items-center justify-center flex-col gap-4 w-full mb-6">
        {itemsQA.map((item, index) => {
          const isOpen = openCardIndex === index;

          return (
            <div
              key={index}
              onClick={() => toggleCard(index)}
              className={`w-72 md:w-96 lg:w-[542px] xl:w-[620px] rounded-lg flex flex-col cursor-pointer transition-all duration-300 overflow-hidden ${
                isOpen ? "bg-background-green/10" : "bg-background-QA2"
              }`}
            >
              <div className="h-[52px] px-3 flex items-center justify-between w-full gap-2">
                <p className="font-inter font-normal text-[18px] leading-5 text-foreground-pureWhite">
                  {item.question}
                </p>

                <Image
                  src={OpenCardIcon}
                  alt="Icone para abrir o card"
                  width={20}
                  height={20}
                  className={`shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 px-3 ${
                  isOpen ? "max-h-[500px] pb-4" : "max-h-0 pb-0"
                }`}
              >
                <p
                  className="
                    font-inter
                    text-foreground-card
                    font-medium
                    sm:font-normal
                    text-sm
                    md:text-base
                    lg:text-lg
                    xl:text-xl
                    leading-4
                    md:leading-4
                    lg:leading-5
                    xl:leading-6
                    text-start
                  "
                >
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
