"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import UpIcon from "../../../public/assets/Icons/up-to-top-icon.svg";

export default function ButtonClickToTop() {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      className={`fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-50 rounded-full transition-opacity ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Voltar ao topo"
    >
      <Image
        src={UpIcon}
        alt="Ícone de seta para cima"
        width={32}
        height={52}
        className="w-7 h-12 md:w-10 md:h-16 lg:w-12 lg:h-18 shadow-lg transition-transform transform hover:scale-110 active:scale-95 duration-200 ease-in-out"
        draggable="false"
      />
    </button>
  );
}