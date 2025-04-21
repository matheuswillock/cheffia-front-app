import Link from "next/link";
import Image from "next/image";
import Frame488 from "../../public/assets/Icons/Frame-488.svg";
import Frame489 from "../../public/assets/Icons/Frame-489.svg";
import Frame490 from "../../public/assets/Icons/Frame-490.svg";
import Separator from "../../public/assets/Icons/separator.svg"
import BurttonCta from "./ButtonCta";

export default function ApresentationMissionAndValues() {
  const itemsValue = [
    {
      title: "Inovação",
      description:
        "Compromisso com o futuro, sempre buscando superar limites com tecnologia e criatividade.",
    },
    {
      title: "Qualidade",
      description:
        "Excelência em cada detalhe para garantir resultados consistentes e satisfatórios.",
    },
    {
      title: "Respeito",
      description:
        "Valorização das pessoas por meio de relações pautadas na transparência, com foco na excelência do atendimento e na satisfação de todos.",
    },
    {
      title: "Autenticidade",
      description:
        "Uma marca reconhecida por sua singularidade e originalidade, que proporciona experiências únicas e genuínas a todos os clientes.",
    },
    {
      title: "Atemporalidade",
      description:
        "Criar soluções que permanecem relevantes e adaptáveis em um mundo em constante evolução.",
    },
  ];

  return (
    <section className="bg-background-missionAndValues -mt-12 py-28 flex flex-col items-center gap-12 justify-center overflow-hidden">
      <div className="flex flex-col items-start justify-start gap-8 w-full px-12 relative">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div
            className="
              absolute
              top-[-15%]
              left-[48%]
              h-[180px]
              w-[220px]
              opacity-60
              blur-3xl
              bg-neon-radial
              rounded-full
              z-0
            "
          />

          <div
            className="
              absolute
              top-[90%]
              left-[-12%]
              h-52
              w-56
              opacity-40
              blur-3xl
              bg-neon-radial
              rounded-full
              z-0
            "
          />
        </div>

        <div
          className="
            w-36
            h-7
            flex
            items-center
            justify-center
            text-xs
            leading-3
            relative
            bg-linear-green-mission
            p-[1px]
            rounded-3xl
          "
        >
          <div
            className="
              w-full
              h-full
              flex
              items-center
              justify-center
              rounded-3xl
              bg-background-missionAndValues
            "
          >
            <p className="font-normal font-inter text-foreground-green relative z-10">
              Nossa missão
            </p>
          </div>
        </div>

        <div className="text-right w-full flex flex-col items-start justify-start">
          <p className="font-normal text-start text-xl leading-5 text-foreground-pureWhite w-[217px] relative z-10">
            Revolucionar a gestão do setor food service
          </p>

          <p className="font-extralight text-start text-base leading-[18px] text-foreground-white mt-2 font-inter w-[297px] relative z-10">
            através de soluções tecnológicas intuitivas e descomplicadas,
            proporcionando aos clientes uma experiência fluida, eficiente e
            prazerosa.
          </p>
        </div>

        <Image
          src={Frame488}
          alt="Frame 488"
          width={296}
          height={94}
          className="relative z-10"
        />
      </div>

      <div className="flex flex-col items-end justify-end gap-8 w-full px-12 relative">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div
            className="
              absolute
              top-[42%]
              left-[45%]
              h-[280px]
              w-[270px]
              opacity-40
              blur-3xl
              bg-neon-radial
              rounded-full
              z-0
            "
          />
        </div>

        <div
          className="
            w-36
            h-7
            flex
            items-center
            justify-center
            text-xs
            leading-3
            relative
            bg-linear-green-mission-2
            p-[1px]
            rounded-3xl
          "
        >
          <div
            className="
              w-full
              h-full
              flex
              items-center
              justify-center
              rounded-3xl
              bg-background-missionAndValues
              relative z-10
            "
          >
            <p className="font-normal font-inter text-foreground-green relative z-10">
              Nossa visão
            </p>
          </div>
        </div>

        <div className="text-right w-full flex flex-col items-end justify-end">
          <p className="font-normal text-xl leading-5 text-foreground-pureWhite w-52 relative z-10">
            Ser referência em inovação e excelência
          </p>

          <p className="font-extralight text-base leading-[18px] text-foreground-white mt-2 font-inter w-[269px] relative z-10">
            no desenvolvimento de ferramentas que redefinem como empresas de
            food service operam e interagem com seus clientes, estabelecendo
            novos padrões de eficiência e conexão.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 w-full">
          <Image
            src={Frame489}
            alt="Frame 489"
            width={175}
            height={140}
            className="relative z-10"
          />

          <Image
            src={Frame490}
            alt="Frame 490"
            width={142}
            height={140}
            className="relative z-10"
          />
        </div>
      </div>

      <div className="flex flex-col items-start justify-start gap-6 mt-8 w-full px-12">
        <div
          className="
              h-7
              w-36
              px-2
              py-1
              flex
              flex-col
              items-center
              justify-center
              gap-1
              border-[1px]
              border-border-green
              rounded-full
              bg-transparent
            "
        >
          <p
            className="
            text-foreground-green
              text-center
              font-inter
              font-normal
              text-xs
              leading-3
            "
          >
            Nossos valores
          </p>
        </div>

        {itemsValue.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-start justify-start gap-2 w-[277px]"
          >
            <p className="font-normal text-xl leading-6 text-foreground-pureWhite">
              {item.title}
            </p>

            <p className="font-inter font-extralight text-base leading-4 text-foreground-pureWhite">
              {item.description}
            </p>

            {index < itemsValue.length - 1 && (
              <Image src={Separator} alt="Separator" className="mt-2" />
            )}
          </div>
        ))}
      </div>

      <BurttonCta />
    </section>
  );
}