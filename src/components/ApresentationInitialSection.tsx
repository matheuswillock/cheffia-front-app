import ButtonCta from "./ButtonCta";

interface ApresentationInitialSectionProps {
  setIsModalOpen: () => void;
}

export default function ApresentationInitialSection({
  setIsModalOpen,
}: ApresentationInitialSectionProps) {
  return (
    <section className="hero w-screen flex flex-col items-center text-center py-12 md:py-14 lg:py-20 gap-8 sm:">
      <div className="flex flex-col items-center gap-4 sm:gap-5 xl:gap-6">
        <h1
          className="
            w-72
            sm:w-80
            md:w-[480px]
            lg:w-[580px]
            xl:w-[720px]
            2xl:w-[920px]
            h-32
            sm:h-36
            md:h-28
            lg:h-32
            xl:h-44
            2xl:h-52
            text-5xl
            sm:text-[56px]
            lg:text-6xl
            xl:text-[80px]
            2xl:text-[96px]
            font-normal
            leading-10
            sm:leading-[46px]
            md:leading-[48px]
            xl:leading-[72px]
            2xl:leading-[88px]
            font-clash
            text-foreground-default
          "
        >
          <span className="underline decoration-primary/70 decoration-2 underline-offset-4 md:underline-offset-[6px] rounded-xl">
            Di
          </span>
          g
          <span className="underline decoration-primary/70 decoration-2 underline-offset-4 md:underline-offset-[6px] rounded-xl">
            a adeus
          </span>{" "}
          aos <span className="text-primary">erros</span> nos pedidos
        </h1>

        <p
          className="
            w-[304px]
            sm:w-[480px]
            md:w-[600px]
            lg:w-[580px]
            xl:w-[720px]
            2xl:w-[920px]
            h-16
            sm:h-20
            md:h-16
            lg:h-20
            xl:h-24
            2xl:h-32
            text-xl
            sm:text-2xl
            lg:text-3xl
            xl:text-4xl
            2xl:text-5xl
            text-center
            leading-6
            sm:leading-8
            lg:leading-10
            xl:leading-[40px]
            2xl:leading-[52px]
            tracking-[-0.02em]
            font-extralight
            font-inter
            text-foreground-default
          "
        >
          Seu cardápio projetado para otimizar o fluxo do atendimento inicial
          até o pagamento.
        </p>
      </div>

      <ButtonCta 
        setIsModalOpen={setIsModalOpen}
      />
    </section>
  );
}