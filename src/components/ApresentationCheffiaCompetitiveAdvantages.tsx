import Image from "next/image";
import Frame485 from "../../public/assets/Icons/Frame-485.svg"
import Frame486 from "../../public/assets/Icons/Frame-486.svg"
import Frame487 from "../../public/assets/Icons/Frame-487.svg"
import BurttonCta from "./ButtonCta";

export default function ApresentationCheffiaCompetitiveAdvantages() {

  const items = [
    {
      image: Frame485,
      title: "Pagamentos digitalizados",
      description:
        "Processamento de pagamentos integrado, com suporte a Pix e carteiras digitais, oferecendo praticidade e modernidade.",
    },
    {
      image: Frame486,
      title: "Plataforma confiável e avançada",
      description:
        "Um sistema robusto, com alta qualidade e estabilidade, desenvolvido para atender às demandas mais exigentes do setor food service.",
    },
    {
      image: Frame487,
      title: "Implantação ágil",
      description:
        "Coloque o sistema em funcionamento em questão de horas, com uma configuração intuitiva para acelerar a operação do seu estabelecimento.",
    },
  ];

  return (
    <section className="bg-background-default rounded-3xl -mt-16 p-8 flex flex-col items-center gap-6 justify-center relative overflow-hidden z-10">
      <div className="relative flex flex-col items-center justify-center mt-10">
        <div className="absolute -top-[60%] flex items-center justify-center w-full pointer-events-none">
          <div className="h-11 w-[90%] opacity-100 blur-lg bg-neon-radial-Competitive-advantages rounded-full z-10" />
        </div>

        <div className="flex flex-col items-center justify-center gap-1 text-[32px] leading-8 text-foreground-pureWhite">
          <p className="font-thin">Diferenciais</p>
          <p className="font-medium">Competitivos</p>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center gap-2 mb-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center gap-4 bg-background-cardAdvantages rounded-3xl p-6"
          >
            <Image src={item.image} alt="Frame 485" width={258} height={131} />

            <div className="flex flex-col items-start justify-start gap-2 text-start">
              <h3 className="font-inter text-base font-normal leading-6">
                {item.title}
              </h3>

              <p className="font-inter text-sm font-light leading-4 text-foreground-card w-64">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <BurttonCta />
    </section>
  );
}
