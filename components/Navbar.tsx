"use client";

import { MouseEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "../public/assets/Icons/logo-horizontal.svg"
import Close from "../public/assets/Icons/close.svg";
import Menu from "../public/assets/Icons/menu.svg";
import InstagramNavIcon from "../public/assets/Icons/instagram-nav-icon.svg";
import WhatsNavIcon from "../public/assets/Icons/whats-nav-icon.svg"

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToSection = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    const nextHash = `#${targetId}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
  };

  const handleMenuItemClick = (
    event: MouseEvent<HTMLAnchorElement>,
    targetId: string,
    shouldCloseMobileMenu = false,
  ) => {
    event.preventDefault();

    if (shouldCloseMobileMenu) {
      setMenuOpen(false);
      requestAnimationFrame(() => {
        scrollToSection(targetId);
      });
      return;
    }

    scrollToSection(targetId);
  };

  const items = [
    {
      href: "#about",
      targetId: "about",
      label: "Sobre a Cheffia",
    },
    {
      href: "#features",
      targetId: "features",
      label: "Funcionalidades",
    },
    {
      href: "#faq",
      targetId: "faq",
      label: "Contate-nos",
    }
  ];

  return (
    <header className="w-full h-24 bg-background-default text-foreground-default sm:h-28">
      <nav className="h-full mx-auto flex justify-between items-center px-6 sm:px-10 md:px-6 lg:px-16">
        <div className=" flex items-center justify-start">
          <Link href="/">
            <Image
              src={Logo}
              alt="Cheffia Logo"
              width={167}
              height={46}
              className="sm:w-28 md:w-36 lg:w-44 xl:w-52"
              priority={true}
            />
          </Link>
        </div>

        <ul className="hidden md:flex  gap-4 lg:gap-6 items-center justify-center">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="ty-subtitle-2 sm:text-base lg:text-lg leading-[18px] text-foreground-default hover:text-primary hover:cursor-pointer hover:underline"
                onClick={(event) => handleMenuItemClick(event, item.targetId)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center justify-end gap-4 lg:gap-6">
          <div className="lg:flex gap-3 hidden ">
            <Link
              href={
                "https://wa.me/+5511988859573/?text=Ol%C3%A1%2C+eu+tenho+uma+d%C3%BAvida%21"
              }
              className="hidden md:flex items-center justify-center"
            >
              <Image
                src={WhatsNavIcon}
                width={32}
                alt={"Entrar no Instagram"}
                className="w-8 h-8"
              />
            </Link>

            <Link
              href={"https://www.instagram.com/cheffia.app/"}
              className="hidden md:flex items-center justify-center"
            >
              <Image
                src={InstagramNavIcon}
                width={32}
                alt={"Entrar no Instagram"}
                className="w-8 h-8"
              />
            </Link>
          </div>

          {/* <Link href="/sign-in">
            <button
              className="
                h-8
                text-center
                justify-center
                items-center
                bg-transparent
                text-foreground-green
                border
                border-primary
                px-4
                rounded-full
                text-base
                font-medium
                font-inter
                hover:bg-background-green
                hover:text-foreground-black
                transition-all
                duration-300
              "
            >
              Área do cliente
            </button>
          </Link> */}
        </div>

        {/* Botão de menu para mobile */}
        <button
          className="block md:hidden text-foreground-default p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {!menuOpen && <Image src={Menu} alt="Open menu" width={33} />}
        </button>
      </nav>

      {/* Menu mobile */}
      {menuOpen && (
        <div>
          <ul className="fixed top-0 left-0 w-full h-full bg-background-default px-6 py-6 flex flex-col gap-5 z-50">
            <li className="flex justify-between items-center">
              <Image
                src={Logo}
                alt="Cheffia Logo"
                className="w-44 ml-[-14px]"
                priority={true}
              />
              <button
                className="text-primary"
                onClick={() => setMenuOpen(false)}
              >
                <Image
                  src={Close}
                  alt="Close menu"
                  width={14}
                  height={14}
                  className="sm:w-4"
                />
              </button>
            </li>
            {items.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-foreground-default ty-subtitle-2 text-lg leading-[18px] hover:text-primary hover:cursor-pointer hover:underline"
                  onClick={(event) => handleMenuItemClick(event, item.targetId, true)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Linha decorativa */}
      <div
        className="
        w-[64%]
        h-[1px]
        sm:w-[366px]
        lg:h-[2px]
        lg:w-[538px]
        xl:w-[800px]
        absolute
        transform
        right-1/2
        translate-x-1/2
        bg-gradient-to-r
        from-transparent
        via-primary
        to-transparent"
      />
    </header>
  );
}

