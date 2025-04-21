import Link from "next/link";

export default function BurttonCta() {
  return (
    <Link href="https://docs.google.com/forms/d/e/1FAIpQLSdxcP4uLuLXslDcWt6IGcpWrBg-u_gUjVlU1t_e5lhg8g4m3w/viewform">
      <button
        aria-label="Entrar na lista de espera"
        className="
        bg-button
        text-foreground-aboutBlack
          px-6
          py-3
          h-auto
          leading-5
          text-lg
          font-medium
          font-inter
          rounded-full
          shadow-md
          hover:bg-button-dark
          transition
        "
      >
        Entrar na lista de espera
      </button>
    </Link>
  );
}