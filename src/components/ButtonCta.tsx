import Link from "next/link";

export default function BurttonCta() {
  return (
    <Link href="/sign-up">
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