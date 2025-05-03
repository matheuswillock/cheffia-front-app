import Link from "next/link";

export default function ButtonCta() {
  return (
    <Link href="https://docs.google.com/forms/d/e/1FAIpQLSdxcP4uLuLXslDcWt6IGcpWrBg-u_gUjVlU1t_e5lhg8g4m3w/viewform">
      <button
        aria-label="Entrar na lista de espera"
        className="
        bg-button
        text-foreground-aboutBlack
          px-6
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
        Entrar na lista de espera
      </button>
    </Link>
  );
}