import Image from "next/image";
import Frame454 from "../public/assets/Icons/Frame-454.svg";
import CheckIcon from "../public/assets/Icons/icon-check.svg"
import ButtonCta from "./ButtonCta";

interface ApresentationCheffiaAboutProps {
  setIsModalOpen: () => void;
}

export default function ApresentationCheffiaAbout({
  setIsModalOpen,
}: ApresentationCheffiaAboutProps) {
  return (
    <section
      id="about"
      className="bg-background-white w-full max-w-full -mt-12 py-28 xl:py-40 px-10 flex flex-col items-center justify-center gap-10 lg:gap-16 xl:gap-20"
    >
      <div
        className="
          flex
          flex-row
          items-center
          justify-between
          w-full
          max-w-[460px]
          sm:max-w-[540px]
          md:max-w-[620px]
          lg:max-w-[814px]
          xl:max-w-[980px]
          2xl:max-w-[1100px]
          gap-10
          relative
          z-10
          mt-16
        "
      >
        <div className="flex flex-col gap-4 xl:gap-12">
          <div
            className="
              h-7
              w-36
              md:h-8
              md:w-44
              lg:h-10
              lg:w-56
              xl:h-12
              xl:w-72
              px-2
              py-1
              flex
              flex-col
              items-center
              justify-center
              gap-1
              border-[1px]
              border-border-about
              rounded-full
              bg-background-white
            "
          >
            <p
              className="
              text-foreground-about
                text-center
                font-inter
                font-medium
                text-xs
                md:text-sm
                lg:text-lg
                xl:text-2xl
                leading-3
                md:leading-4
                lg:leading-6
                xl:leading-8
              "
            >
              Food Service Manager
            </p>
          </div>

          <div className="max-w-[280px] lg:max-w-[380px] xl:max-w-[462px] flex flex-col justify-items-start gap-4">
            <p
              className="
                font-clash
                font-medium
                md:max-w-[280px]
                lg:max-w-[360px]
                xl:max-w-[462px]
                text-start
                text-xl
                sm:text-2xl
                md:text-2xl
                lg:text-4xl
                xl:text-6xl
                leading-6
                md:leading-7
                lg:leading-10
                xl:leading-[60px]
                text-foreground-aboutBlack
                relative
                z-10
              "
            >
              A Cheffia é uma solução digital completa para gestão de food
              service
            </p>
          </div>
        </div>

        <Image
          src={Frame454}
          alt="Mockup no Iphone 16 Pro"
          width={277}
          height={360}
          className="xl:w-[277px] xl:h-[360px] lg:w-[200px] lg:h-[260px] md:w-[150px] md:h-[200px] w-[120px] h-[156px] relative z-10"
        />
      </div>

      <div
        className="
          flex
          flex-row
          items-center
          justify-between
          w-full
          max-w-[460px]
          sm:max-w-[540px]
          md:max-w-[620px]
          lg:max-w-[814px]
          xl:max-w-[980px]
          2xl:max-w-[1100px]
          gap-10
        "
      >
        <p className="text-start font-inter font-normal text-base xl:text-2xl leading-5 text-foreground-aboutBlack relative z-10">
          Projetada para modernizar e simplificar operações, oferecemos uma
          experiência fluida e eficiente tanto para os clientes quanto para os
          donos de restaurantes.
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-center gap-1">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div
            className="
              hidden
              lg:block
              absolute
              top-[86%]
              lg:top-[-80%]
              xl:top-[95%]
              left-[-30%]
              lg:left-[-20%]
              h-40
              lg:h-80
              w-40
              lg:w-80
              opacity-30
              blur-3xl
              bg-neon-radial-about
              rounded-full
              z-0
            "
          />

          <div
            className="
              hidden
              xl:block
              absolute
              xl:top-[-70%]
              xl:left-[-10%]
              xl:h-[400px]
              xl:w-[400px]
              opacity-30
              blur-3xl
              bg-neon-radial-about
              rounded-full
              z-0
            "
          />

          <div
            className="
              absolute
              top-[-18%]
              lg:top-[-45%]
              xl:top-[-55%]
              left-[80%]
              xl:left-[90%]
              h-44
              lg:h-64
              xl:h-80
              w-40
              lg:w-64
              xl:w-80
              opacity-40
              lg:opacity-60
              blur-3xl
              bg-neon-radial-about
              rounded-full
              z-0
            "
          />

          <div
            className="
              absolute
              h-32
              lg:h-52
              w-28
              lg:w-32
              top-[45%]
              lg:top-[50%]
              left-[30%]
              lg:left-[40%]
              transform
              -translate-x-1/2
              -translate-y-1/2
              opacity-40
              lg:opacity-60
              blur-3xl
              bg-neon-radial-about
              rounded-full
              z-0
            "
          />

          <div
            className="
              absolute
              top-[86%]
              lg:top-[130%]
              xl:top-[95%]
              left-[-30%]
              lg:left-[-20%]
              h-40
              lg:h-80
              w-40
              lg:w-80
              opacity-40
              lg:opacity-60
              blur-3xl
              bg-neon-radial-about
              rounded-full
              z-0
            "
          />
        </div>

        <h3
          className="
            font-medium
            text-2xl
            md:text-3xl
            lg:text-4xl
            xl:text-6xl
            leading-6
            text-foreground-aboutBlack
            relative
            z-10
            mb-4
            lg:mb-6
            xl:mb-8
            2xl:mb-10
          "
        >
          Impacto esperado
        </h3>

        <div className="flex flex-col md:flex-row gap-4 lg:gap-8 xl:gap-10 2xl:gap-12">
          <div
            className="
              w-80
              md:w-72
              lg:w-80
              xl:w-[400px]
              md:h-[280px]
              xl:h-[342px]
              border-[1px]
              border-border-black
              rounded-xl
              px-6
              py-8
              bg-background-white
              flex
              flex-col
              items-center
              justify-between
              mx-auto
              gap-2
            "
          >
            <h3 className="font-inter font-semibold text-lg md:text-xl xl:text-2xl leading-6 text-foreground-black relative z-10">
              Para Restaurantes
            </h3>

            <div
              className="
                flex
                flex-col
                gap-3
                font-inter
                font-medium
                text-sm
                md:text-base
                lg:text-lg
                xl:text-xl
                leading-4
                md:leading-4
                lg:leading-4
                text-foreground-black
              "
            >
              <div className="flex flex-row items-center gap-3">
                <Image
                  src={CheckIcon}
                  alt="Mockup no Iphone 16 Pro"
                  className="relative z-10"
                />
                <p className="relative z-10">
                  Redução de erros operacionais que geram insatisfação do
                  consumidor e desperdício.
                </p>
              </div>

              <div className="flex flex-row items-center gap-3">
                <Image
                  src={CheckIcon}
                  alt="Mockup no Iphone 16 Pro"
                  className="relative z-10"
                />
                <p className="relative z-10">
                  Aumento da eficiência no fluxo de trabalho.
                </p>
              </div>

              <div className="flex flex-row items-center gap-3">
                <Image
                  src={CheckIcon}
                  alt="Mockup no Iphone 16 Pro"
                  className="relative z-10"
                />
                <p className="relative z-10">
                  Melhor controle financeiro e tomada de decisões estratégicas.
                </p>
              </div>
            </div>
          </div>

          <div
            className="
              w-80
              md:w-96
              lg:w-[420px]
              xl:w-[580px]
              md:h-[280px]
              xl:h-[342px]
              border-[1px]
              border-border-black
              rounded-xl
              px-6
              py-6
              bg-background-white
              flex
              flex-col
              items-center
              justify-between
              mx-auto
              gap-2
            "
          >
            <h3 className="font-inter font-semibold text-lg md:text-xl xl:text-2xl leading-6 text-foreground-black relative z-10">
              Para Clientes
            </h3>

            <div
              className="
                flex
                flex-col
                gap-3
                font-inter
                font-medium
                text-sm
                md:text-base
                lg:text-lg
                xl:text-xl
                leading-4
                md:leading-4
                lg:leading-4
                text-foreground-black
              "
            >
              <div className="flex flex-row items-center gap-3">
                <Image
                  src={CheckIcon}
                  alt="Mockup no Iphone 16 Pro"
                  className="relative z-10"
                />
                <p className="relative z-10">
                  Satisfação em ter o controle de sua comanda através de uma
                  experiência rápida, intuitiva e sem complicações.
                </p>
              </div>

              <div className="flex flex-row items-center gap-3">
                <Image
                  src={CheckIcon}
                  alt="Mockup no Iphone 16 Pro"
                  className="relative z-10"
                />
                <p className="relative z-10">
                  Agilidade em chegar no local e poder se auto servir, sem
                  esperar um contato visual para chamar o garçom, pedir o
                  cardápio, escolher e depois chamar o garçom novamente para
                  então fazer o pedido.
                </p>
              </div>

              <div className="flex flex-row items-center gap-3">
                <Image
                  src={CheckIcon}
                  alt="Mockup no Iphone 16 Pro"
                  className="relative z-10"
                />
                <p className="relative z-10">
                  Maior conveniência no pagamento e personalização do
                  atendimento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-1 md:mx-auto md:w-full">
        <p
          className="
            max-w-[270px]
            sm:max-w-[360px]
            md:max-w-[628px]
            lg:max-w-[650px]
            xl:max-w-[1000px]
            mt-2
            font-inter
            font-medium
            lg:font-light
            text-base
            md:text-lg
            lg:text-xl
            xl:text-2xl
            leading-5
            text-foreground-aboutBlack
            relative
            z-10
          "
        >
          Digitalize e otimize o gerenciamento de pedidos, pagamentos e
          operações financeiras em restaurantes, promovendo eficiência, redução
          de erros e{" "}
          <span className="underline decoration-foreground-black decoration-1 underline-offset-1 rounded-xl">
            satisfa
          </span>
          ç
          <span className="underline decoration-foreground-black decoration-1 underline-offset-1 rounded-xl">
            ão{" "}
          </span>
          <span className="underline decoration-foreground-black decoration-1 underline-offset-1 rounded-xl">
            para os usuários.
          </span>
        </p>
      </div>

      <ButtonCta 
        setIsModalOpen={setIsModalOpen}
      />
    </section>
  );
}
