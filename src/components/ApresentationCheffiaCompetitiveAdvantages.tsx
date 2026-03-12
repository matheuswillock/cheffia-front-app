import Image from "next/image";
import Frame485 from "../../public/assets/Icons/Frame-485.svg";
import Frame486 from "../../public/assets/Icons/Frame-486.svg";
import Frame487 from "../../public/assets/Icons/Frame-487.svg";
import ButtonCta from "./ButtonCta";

interface ApresentationCheffiaCompetitiveAdvantagesProps {
  setIsModalOpen: () => void;
}

export default function ApresentationCheffiaCompetitiveAdvantages({
  setIsModalOpen,
}: ApresentationCheffiaCompetitiveAdvantagesProps) {
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
    <section
      className="
          bg-background-default
          rounded-3xl
          -mt-16
          pt-8
          pb-16
          flex
          flex-col
          items-center
          gap-6
          lg:gap-10
          justify-center
          relative
          overflow-hidden
          z-10
        "
    >
      <div className="relative flex flex-col items-center justify-center mt-10">
        <div className="absolute -top-[45%] sm:-top-[42%] md:-top-[35%] lg:-top-[30%] xl:-top-[15%] 2xl:-top-[12%] flex items-center justify-center w-full pointer-events-none">
          <div className="h-11 w-[90%] opacity-100 blur-lg bg-neon-radial-Competitive-advantages rounded-full z-10" />
        </div>

        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            gap-1
            text-[30px]
            sm:text-[32px]
            md:text-4xl
            lg:text-5xl
            xl:text-6xl
            leading-8
            text-foreground-pureWhite
          "
        >
          <p className="font-thin">Diferenciais</p>
          <p className="font-medium">Competitivos</p>
        </div>
      </div>

      <div className="relative flex flex-col lg:flex-row items-center justify-center gap-2 xl:gap-4 mb-4 w-full max-w-full">
        {items.map((item, index) => (
          <div
            key={index}
            className="
              flex
              flex-col
              items-center
              justify-between
              gap-2
              sm:gap-4
              xl:gap-8
              bg-background-cardAdvantages
              rounded-3xl
              px-7
              py-8
              max-w-[280px]
              sm:max-w-[350px]
              lg:max-w-[320px]
              xl:max-w-[420px]
              2xl:max-w-[450px]
              lg:h-[360px]
              xl:h-[450px]
            "
          >
            <Image
              src={item.image}
              alt="Frame"
              width={300}
              height={152}
              className="xl:w-[380px] xl:h-[200px] lg:w-[280px] object-contain"
              priority={true}
            />

            <div className="flex flex-col items-start justify-start gap-2 text-start w-full">
              <h3 className="font-inter text-base lg:text-lg xl:text-2xl font-normal lg:font-medium leading-6">
                {item.title}
              </h3>

              <p className="font-inter text-sm lg:text-base xl:text-lg font-light leading-4 lg:leading-4 text-foreground-card">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <ButtonCta 
        setIsModalOpen={setIsModalOpen}
      />
    </section>
  );
}
