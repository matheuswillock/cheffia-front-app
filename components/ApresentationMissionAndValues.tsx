import Link from "next/link";
import Image from "next/image";
import Frame488 from "../public/assets/Icons/Frame-488.svg";
import Frame489 from "../public/assets/Icons/Frame-489.svg";
import Frame490 from "../public/assets/Icons/Frame-490.svg";
import Separator from "../public/assets/Icons/separator.svg"
import ButtonCta from "./ButtonCta";

interface ApresentationMissionAndValuesProps {
  setIsModalOpen: () => void;
}

export default function ApresentationMissionAndValues({
  setIsModalOpen,
}: ApresentationMissionAndValuesProps) {
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
      title: "Atemporalidade",
      description:
        "Criar soluções que permanecem relevantes e adaptáveis em um mundo em constante evolução.",
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
  ];

  return (
    <section
      className="
        w-full
        max-w-full
        bg-background-missionAndValues
        -mt-12
        mx-auto
        py-28
        sm:px-8
        md:px-8
        lg:px-10
        xl:px-16
        2xl:px-24
        flex
        flex-col
        items-center
        gap-12
        justify-center
        overflow-hidden
      "
    >
      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          gap-16
          sm:gap-24
          w-full
          lg:flex-row
          xl:gap-0
          xl:items-start
          xl:justify-between
        "
      >
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
            sm:w-40
            sm:h-8
            md:w-44
            md:h-9
            lg:w-48
            lg:h-10
            xl:w-52
            xl:h-11
            2xl:w-56
            2xl:h-12
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
              <p
                className="
                font-normal
                sm:font-medium
                text-sm
                sm:text-base
                md:text-lg
                lg:text-xl
                xl:text-2xl
                font-inter
                text-foreground-green
                relative
                z-10
              "
              >
                Nossa missão
              </p>
            </div>
          </div>

          <div className="text-right w-full flex flex-col items-start justify-start">
            <p
              className="
              font-normal
              sm:font-medium
              text-start
              text-xl
              md:text-2xl
              lg:text-3xl
              xl:text-4xl
              leading-5
              sm:leading-5
              md:leading-6
              lg:leading-7
              xl:leading-[40px]
              text-foreground-pureWhite
              w-[217px]
              md:w-[320px]
              lg:w-[420px]
              xl:w-[500px]
              2xl:w-[600px]
              relative
              z-10
            "
            >
              Revolucionar a gestão do setor food service
            </p>

            <p
              className="
              font-extralight
              sm:font-light
              text-start
              text-base
              md:text-lg
              lg:text-xl
              xl:text-xl
              leading-[18px]
              sm:leading-5
              md:leading-6
              lg:leading-6
              xl:leading-7
              text-foreground-white
              mt-2
              font-inter
              w-[297px]
              md:w-[320px]
              lg:w-[446px]
              xl:w-[370px]
              relative
              z-10
            "
            >
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
            className="
              relative
              z-10
              w-[296px]
              h-[94px]
              sm:w-[360px]
              sm:h-[120px]
              xl:w-[440px]
              xl:h-[170px]
            "
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
            sm:w-40
            sm:h-8
            md:w-44
            md:h-9
            lg:w-48
            lg:h-10
            xl:w-52
            xl:h-11
            2xl:w-56
            2xl:h-12
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
              <p
                className="
                font-inter
                text-foreground-green
                relative
                z-10
                font-normal
                sm:font-medium
                text-sm
                sm:text-base
                md:text-lg
                lg:text-xl
                xl:text-2xl
              "
              >
                Nossa visão
              </p>
            </div>
          </div>

          <div className="text-right w-full flex flex-col items-end justify-end">
            <p
              className="
              font-normal
              sm:font-medium
              text-xl
              md:text-2xl
              lg:text-3xl
              xl:text-4xl
              leading-5
              sm:leading-5
              md:leading-6
              lg:leading-7
              xl:leading-[40px]
              text-foreground-pureWhite
              w-56
              md:w-[290px]
              lg:w-[390px]
              xl:w-[460px]
              2xl:w-[600px]
              relative
              z-10
            "
            >
              Ser referência em inovação e excelência
            </p>

            <p
              className="
                font-extralight
                sm:font-light
                text-end
                text-base
                md:text-lg
                lg:text-xl
                xl:text-xl
                leading-[18px]
                sm:leading-5
                md:leading-6
                lg:leading-6
                xl:leading-7
                text-foreground-white
                mt-2
                font-inter
                w-[276px]
                md:w-[320px]
                lg:w-[446px]
                xl:w-[446px]
                relative
                z-10
              "
            >
              no desenvolvimento de ferramentas que redefinem como empresas de
              food service operam e interagem com seus clientes, estabelecendo
              novos padrões de eficiência e conexão.
            </p>
          </div>

          <div className="flex items-end justify-end gap-4 w-full">
            <Image
              src={Frame489}
              alt="Frame 489"
              width={175}
              height={140}
              className="relative z-10 w-[175px] h-[140px] sm:w-[215px] sm:h-[180px]"
            />

            <Image
              src={Frame490}
              alt="Frame 490"
              width={142}
              height={140}
              className="relative z-10 w-[142px] h-[140px] sm:w-[175px] sm:h-[180px]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start justify-start gap-6 lg:gap-12 mt-8 w-full px-12">
        <div
          className="
              w-36
              h-7
              sm:w-40
              sm:h-8
              md:w-44
              md:h-9
              lg:w-48
              lg:h-10
              xl:w-52
              xl:h-11
              2xl:w-56
              2xl:h-12
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
              leading-3
              font-normal
              sm:font-medium
              text-sm
              sm:text-base
              md:text-lg
              lg:text-xl
              xl:text-2xl
            "
          >
            Nossos valores
          </p>
        </div>

        <div className="flex flex-col items-start justify-start md:justify-center gap-6 w-full md:grid md:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:gap-12">
          {itemsValue.map((item, index) => (
            <div
              key={index}
              className="
                flex
                flex-col
                items-start
                justify-start
                md:justify-center
                gap-2
                w-[277px]
                md:w-[220px]
                lg:w-[260px]
                xl:w-[312px]
                2xl:w-[350px]
                relative
                z-10
              "
            >
              <p className="font-normal sm:font-medium text-xl xl:text-2xl leading-6 text-foreground-pureWhite">
                {item.title}
              </p>

              <p
                className="
                  font-inter
                  font-extralight
                  text-base
                  lg:text-lg
                  xl:text-xl
                  2xl:text-2xl
                  leading-4
                  lg:leading-5
                  xl:leading-6
                  2xl:leading-6
                  text-foreground-pureWhite
                "
              >
                {item.description}
              </p>

              <Image
                src={Separator}
                alt="Separator"
                className="mt-5 xl:w-[350px] 2xl:w-[400px]"
              />
            </div>
          ))}

          <div className="flex flex-col items-start md:items-center justify-center h-full gap-6 w-full mt-8 md:mt-0">
            <ButtonCta 
              setIsModalOpen={setIsModalOpen}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
