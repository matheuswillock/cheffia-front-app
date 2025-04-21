"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "../../public/assets/logo.png"
import Close from "../../public/assets/Icons/close.svg";
import Menu from "../../public/assets/Icons/menu.svg";
import { useState } from "react";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="container w-full h-24 bg-background-default text-foreground-default sm:h-28">
      <nav className="container h-full mx-auto flex items-center justify-center px-4 mt-2">
        <div className="flex-1 flex items-center justify-center">
          <Link href="/">
            <Image
              src={Logo}
              alt="Cheffia Logo"
              className="w-36 sm:w-56"
              priority={true}
            />
          </Link>
        </div>

        {/* TODO: Liberar quando todo */}
        {/* <button
          className="block md:hidden text-foreground-default"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {!menuOpen && <Image src={Menu} alt="Close menu" width={33} />}
        </button> */}

        {/* <ul className="hidden sm:flex gap-6 items-center">
          <li>
            <Link
              href="#about"
              className="text-sm text-foreground-default hover:text-primary"
            >
              Sobre a Cheffia
            </Link>
          </li>
          <li>
            <Link
              href="#features"
              className="text-sm text-foreground-default hover:text-primary"
            >
              Funcionalidades
            </Link>
          </li>
          <li>
            <Link
              href="#pricing"
              className="text-sm text-foreground-default hover:text-primary"
            >
              Preços
            </Link>
          </li>
          <li>
            <Link
              href="#contact"
              className="text-sm text-foreground-default hover:text-primary"
            >
              Contate-nos
            </Link>
          </li>
        </ul> */}

        {/* TODO: Liberar quando o fluxo de login estiver completo */}
        {/* <div className="hidden md:flex flex-1 justify-end">
          <Link href="/sign-in">
            <button className="bg-primary text-background px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary-dark">
              Área do cliente
            </button>
          </Link>
        </div> */}
      </nav>

      {/* {menuOpen && (
        <div>
          <ul className="fixed top-0 left-0 w-full h-full bg-background-default px-6 flex flex-col gap-5 z-50">
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
                <Image src={Close} alt="Close menu" width={14} height={14} />
              </button>
            </li>
            <li>
              <Link
                href="#about"
                className="text-lg text-foreground-default hover:text-primary mt-[-48px]"
              >
                Sobre a Cheffia
              </Link>
            </li>
            <li>
              <Link
                href="#features"
                className="text-lg text-foreground-default hover:text-primary"
              >
                Funcionalidades
              </Link>
            </li>
            <li>
              <Link
                href="#pricing"
                className="text-lg text-foreground-default hover:text-primary"
              >
                Preços
              </Link>
            </li>
            <li>
              <Link
                href="#contact"
                className="text-lg text-foreground-default hover:text-primary"
              >
                Contate-nos
              </Link>
            </li>

            {/* TODO: Liberar quando o fluxo de login estiver completo */}
      {/* <li>
              <Link href="/sign-in">
                <button className="bg-primary text-foreground-black px-6 py-3 rounded-full text-lg font-semibold hover:bg-primary-dark">
                  Área do cliente
                </button>
              </Link>
            </li> 
          </ul>
        </div>
      )} */}

      <div
        className="
        w-[64%]
        h-[1px]
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