"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import UpIcon from "../../public/assets/Icons/up-to-top-icon.svg";
import { Button } from "@/components/ui/button";

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
    <Button
      onClick={scrollToTop}
      type="button"
      variant="ghost"
      size="icon"
      className={`fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-50 rounded-full transition-opacity ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Voltar ao topo"
    >
      <Image
        src={UpIcon}
        alt=""
        aria-hidden="true"
        width={32}
        height={52}
        className="w-7 h-12 md:w-10 md:h-16 lg:w-12 lg:h-18 shadow-lg transition-transform transform hover:scale-110 active:scale-95 duration-200 ease-in-out"
        draggable="false"
      />
    </Button>
  );
}
