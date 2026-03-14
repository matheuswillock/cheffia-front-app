"use client";

import { useState } from "react";
import Image from "next/image";
import QrCodeIcon from "../public/assets/Icons/qr-code-icon.svg";
import CheckIcon from "../public/assets/Icons/check-icon.svg";
import HourIcon from "../public/assets/Icons/hour-icon.svg";
import FinanceIcon from "../public/assets/Icons/financeIcon.svg";
import FavoriteIcon from "../public/assets/Icons/favorite-icon.svg"
import AlertIcon from "../public/assets/Icons/alertIcon.svg";
import ButtonCta from "./ButtonCta";

interface ApresentationFeaturesSectionProps {
  setIsModalOpen: () => void;
}

export default function ApresentationFeaturesSection({
  setIsModalOpen,
}: ApresentationFeaturesSectionProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const handleClick = (index: number) => {
    setSelectedCard(index === selectedCard ? null : index);
  };

  const cards = [
    {
      title: "QR Code e Menu Digital",
      description:
        "Ofereça aos seus clientes uma experiência moderna com QR Codes exclusivos para cada mesa, conectando-os diretamente ao menu digital com fotos e descrições detalhadas.",
      icon: QrCodeIcon,
    },
    {
      title: "Automatização de Pedidos",
      description:
        "Simplifique o fluxo de trabalho com pedidos automatizados que vão direto para a cozinha, reduzindo erros e otimizando a operação do seu estabelecimento.",
      icon: CheckIcon,
    },
    {
      title: "Gestão e Reservas",
      description:
        "Gerencie mesas e reservas de forma eficiente, garantindo organização e uma experiência fluida para seus clientes.",
      icon: HourIcon,
    },
    {
      title: "Pagamentos Web",
      description:
        "Facilite os pagamentos com suporte a PIX e carteiras digitais, proporcionando agilidade e praticidade para seus clientes.",
      icon: FinanceIcon,
    },
    {
      title: "Gerenciamento da Equipe",
      description:
        "Controle o acesso e as permissões da sua equipe com perfis personalizados, garantindo segurança e eficiência na gestão do seu negócio.",
      icon: FavoriteIcon,
    },
    {
      title: "Promoções e Mensageria",
      description:
        "Engaje seus clientes com promoções personalizadas e mensagens diretas, aumentando a fidelidade e o alcance do seu negócio.",
      icon: AlertIcon,
    },
  ];

  return (
    <section
      id="features"
      className="w-full max-w-full flex flex-col items-center justify-center gap-10 py-16 bg-background-black rounded-3xl relative overflow-hidden"
    >
      <div className="flex flex-col items-center justify-center gap-1 md:gap-2 xl:gap-4">
        <p className="font-light text-sm md:text-lg xl:text-2xl 2xl:text-3xl font-inter text-foreground-pureWhite">
          Conheça as nossas
        </p>
        <h2 className="font-clash font-medium text-[32px] md:text-4xl xl:text-6xl 2xl:text-7xl leading-8 text-foreground-green">
          Funcionalidades
        </h2>
      </div>

      <div className="relative flex flex-col items-center justify-center gap-4">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div
            className="
              absolute
              top-[-8%]
              xl:top-[-30%]
              xl:left-[70%]
              left-[50%]
              h-[390px]
              xl:h-[520px]
              w-[390px]
              xl:w-[520px]
              opacity-55
              blur-3xl
              bg-neon-radial
              rounded-full
              z-0
            "
          />

          <div
            className="
              absolute
              h-52
              xl:h-96
              w-[50%]
              xl:w-[80%]
              top-[40%]
              left-[-20%]
              md:left-[0%]
              xl:left-[30]
              transform
              -translate-x-1/2
              -translate-y-1/2
              opacity-20
              blur-3xl
              bg-neon-radial-2
              rounded-full
              z-0
            "
          />

          <div
            className="
              absolute
              top-[70%]
              md:top-[80%]
              xl:top-[90%]
              left-[-65%]
              md:left-[5%]
              xl:left-[20%]
              h-80
              xl:h-96
              w-80
              xl:w-96
              opacity-40
              blur-3xl
              bg-neon-radial
              rounded-full
              z-0
            "
          />
        </div>

        <div
          className="
            relative
            mx-auto
            xl:max-w-[90%]
            my-8
            flex
            flex-col
            items-center
            justify-center
            gap-6
            md:gap-10
            lg:gap-14
            xl:gap-16
            2xl:gap-20
            md:grid
            grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-3
            2xl:grid-cols-3
          "
        >
          {cards.map((card, index) => (
            <div
              key={index}
              className={`relative z-10 ${
                selectedCard === index
                  ? "bg-primary min-h-40"
                  : "bg-background-cardFeature h-40"
              } rounded-3xl w-72 sm:w-80 md:h-52 xl:h-56 p-6 flex flex-col items-center justify-between`}
              onClick={() => handleClick(index)}
            >
              {selectedCard === index ? (
                <div className="h-full flex flex-row items-center justify-start gap-4">
                  <div className="flex justify-between items-center w-full">
                    <p className="text-foreground-black font-inter text-lg md:text-xl leading-[18px] md:leading-[24px] font-medium text-start">
                      {card.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-start justify-start gap-6 md:gap-10">
                  <div className="flex justify-between items-center w-full">
                    <h2 className="text-foreground-pureWhite font-inter font-light leading-5 text-lg md:text-xl xl:text-2xl w-32 xl:w-36 h-9">
                      {card.title}
                    </h2>

                    <Image
                      src={card.icon}
                      alt={`Icon ${card.title}`}
                      width={32}
                      height={32}
                      className="w-8 h-8"
                    />
                  </div>

                  <p className="text-foreground-card font-inter text-sm md:text-base lg:text-lg leading-4 lg:leading-5 font-light text-start">
                    {card.description.length > 100
                      ? `${card.description.slice(0, 98)}...`
                      : card.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ButtonCta 
        setIsModalOpen={setIsModalOpen}
      />
    </section>
  );
}

