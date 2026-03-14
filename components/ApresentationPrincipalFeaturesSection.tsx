"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import QrCodeIcon from "../public/assets/Icons/code-scan-svgrepo-com-2.svg";
import FinanceIcon from "../public/assets/Icons/financeIcon.svg";
import DocIcon from "../public/assets/Icons/docIcon.svg";

export function ApresentationPrincipalFeaturesSection() {
  const carouselRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let scrollInterval: NodeJS.Timeout;

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        const cardWidth = carousel.offsetWidth;
        const scrollLeft = carousel.scrollLeft;
        const totalScrollWidth = carousel.scrollWidth;

        if (scrollLeft + cardWidth >= totalScrollWidth) {
          carousel.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          const nextScrollPosition = scrollLeft + cardWidth;
          carousel.scrollTo({
            left: nextScrollPosition,
            behavior: "smooth",
          });
        }
      }, 4000);
    };

    startAutoScroll();

    return () => clearInterval(scrollInterval);
  }, []);

  const items = [
    {
      title: "QR Code Personalizado",
      description: (
        <div className="text-base font-normal font-inter text-foreground-card flex flex-col items-center justify-center gap-5 text-start leading-[18px]">
          <p>
            Cada mesa possui um{" "}
            <span className="font-semibold underline decoration-foreground-card decoration-1 underline-offset-2 rounded-2xl">
              QR Code exclusivo
            </span>
            , que conecta o cliente ao menu digital do seu estabelecimento.
          </p>

          <p>
            Os pedidos são enviados diretamente para a cozinha, vinculados à
            mesa, estabelecimento e cliente,{" "}
            <span className="font-semibold decoration-foreground-card">
              eliminando erros de
            </span>{" "}
            <span className="font-semibold underline decoration-foreground-card decoration-1 underline-offset-2 rounded-2xl">
              comunica
            </span>
            ç
            <span className="font-semibold underline decoration-foreground-card decoration-1 underline-offset-2 rounded-2xl">
              ão.
            </span>
          </p>
        </div>
      ),
      icon: QrCodeIcon,
    },
    {
      title: "Pedidos Digitais via QR Code",
      description: (
        <div className="text-base font-normal font-inter text-foreground-card flex flex-col items-center justify-center gap-5 leading-[18px]">
          <p>
            Transforme a experiência do cliente com pedidos digitais. O{" "}
            <span className="font-semibold underline decoration-foreground-card decoration-1 underline-offset-2 rounded-2xl">
              QR Code exclusivo
            </span>{" "}
            conecta diretamente ao menu digital do seu negócio.
          </p>

          <p>
            Agilidade e precisão nos pedidos,{" "}
            <span className="font-semibold decoration-foreground-card">
              eliminando erros
            </span>{" "}
            e garantindo uma experiência fluida.
          </p>
        </div>
      ),
      icon: DocIcon,
    },
    {
      title: "Pagamento Integrado",
      description: (
        <div className="text-base font-normal font-inter text-foreground-card flex flex-col items-center justify-center gap-5 leading-[18px]">
          <p>
            Ofereça praticidade com pagamentos integrados via{" "}
            <span className="font-semibold underline decoration-foreground-card decoration-1 underline-offset-2 rounded-2xl">
              PIX e carteiras digitais
            </span>
            .
          </p>

          <p>
            Reduza as{" "}
            <span className="font-semibold decoration-foreground-card">
              filas
            </span>{" "}
            e aumente a{" "}
            <span className="font-semibold decoration-foreground-card">
              rotatividade
            </span>{" "}
            das mesas, proporcionando uma experiência mais eficiente para seus
            clientes.
          </p>
        </div>
      ),
      icon: FinanceIcon,
    },
  ];

  return (
    <section
      ref={carouselRef}
      className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:max-w-[1040px] xl:max-w-[1220px] md:mx-auto px-4 py-8"
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="
            flex-shrink-0
            w-80
            xl:w-96
            h-72
            xl:h-64
            md:mx-auto
            gap-5
            flex
            flex-col
            items-center
            bg-background-card
            rounded-3xl
            px-8
            pt-4
            snap-center
            scroll-smooth
            transition-transform
            duration-300
            ease-in-out
          "
        >
          <div className="flex h-[57px] flex-row items-center gap-4 justify-start mr-16 md:mr-14">
            <Image
              src={item.icon}
              alt={item.title}
              width={43}
              height={43}
              priority={true}
              loading="eager"
            />
            <h3 className="text-xl font-bold font-inter text-transparent bg-clip-text bg-linear-green leading-[1.2]">
              {item.title}
            </h3>
          </div>
          {item.description}
        </div>
      ))}
    </section>
  );
}
