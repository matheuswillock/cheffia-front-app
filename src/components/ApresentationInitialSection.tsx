import BurttonCta from "./ButtonCta";

export default function ApresentationInitialSection() {
  return (
    <section className="hero flex flex-col items-center text-center py-12 gap-8">
      <div className="flex flex-col items-center gap-8">
        <h1 className="w-72 h-[132px] text-5xl font-normal leading-10 font-clash text-foreground-default sm:text-4xl md:text-5xl">
          <span className="underline decoration-primary/70 decoration-2 underline-offset-4 rounded-xl">
            Di
          </span>
          g
          <span className="underline decoration-primary/70 decoration-2 underline-offset-4 rounded-xl">
            a adeus
          </span>{" "}
          aos <span className="text-primary">erros</span> nos pedidos
        </h1>

        <p className="w-[304px] text-xl font-light font-inter text-foreground-default sm:text-2xl md:text-3xl">
          Seu cardápio projetado para otimizar o fluxo do atendimento inicial
          até o pagamento.
        </p>
      </div>
      
      <BurttonCta/>
    </section>
  );

}