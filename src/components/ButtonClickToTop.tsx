"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import UpIcon from "../../public/assets/Icons/up-to-top-icon.svg";

export default function ButtonClickToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Função para rolar a tela para o topo
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Mostrar o botão apenas quando o usuário rolar para baixo
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 rounded-full transition-opacity ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Voltar ao topo"
    >
      <Image
        src={UpIcon}
        alt="Ícone de seta para cima"
        width={24}
        height={24}
      />
    </button>
  );
}