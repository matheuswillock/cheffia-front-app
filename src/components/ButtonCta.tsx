import Link from "next/link";

interface ButtonCtaProps {
  setIsModalOpen: () => void;
}

export default function ButtonCta({ setIsModalOpen }: ButtonCtaProps) {
  return (
    <button
      aria-label="Entrar na lista de espera"
      onClick={setIsModalOpen}
      type="button"
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
  );
}
