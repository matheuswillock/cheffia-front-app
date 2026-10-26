"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Logo from "../../public/assets/Icons/logo-horizontal.svg"
import Close from "../../public/assets/Icons/close.svg";
import Menu from "../../public/assets/Icons/menu.svg";
import InstagramNavIcon from "../../public/assets/Icons/instagram-nav-icon.svg";
import WhatsNavIcon from "../../public/assets/Icons/whats-nav-icon.svg"

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const items = [
    {
      href: "#about",
      label: "Sobre a Cheffia",
    },
    {
      href: "#features",
      label: "Funcionalidades",
    },
    {
      href: "#pricing",
      label: "Preços",
    },
    {
      href: "#contact",
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
                className="sm:text-base lg:text-lg font-inter font-normal leading-[18px] text-foreground-default hover:text-primary hover:cursor-pointer hover:underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center justify-end gap-6 lg:gap-8">
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
                className="w-50 "
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
                className="w-50 "
              />
            </Link>
          </div>

          <Button asChild variant="outline" className="h-10 px-5 font-inter text-primary">
            <Link href="/sign-in">Entrar no App</Link>
          </Button>
        </div>

        {/* Botão de menu para mobile */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="min-h-11 min-w-11 md:hidden"
        >
          <Image src={menuOpen ? Close : Menu} alt="" aria-hidden="true" width={24} height={24} />
        </Button>
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
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
                className="min-h-11 min-w-11"
              >
                <Image
                  src={Close}
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                />
              </Button>
            </li>
            {items.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-foreground-default text-lg font-inter font-normal leading-[18px] hover:text-primary hover:cursor-pointer hover:underline"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/sign-in" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center justify-center rounded-md border border-primary px-4 font-inter text-base font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                Entrar no App
              </Link>
            </li>
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
