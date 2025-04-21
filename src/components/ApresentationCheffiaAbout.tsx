import Image from "next/image";
import Frame454 from "../../public/assets/Icons/Frame-454.svg";
import CheckIcon from "../../public/assets/Icons/icon-check.svg"
import BurttonCta from "./ButtonCta";

export default function ApresentationCheffiaAbout() {
  return (
    <section className="bg-background-white -mt-12 py-28 px-10 flex flex-col items-center justify-center gap-10">
      <div className="container flex flex-row items-center justify-center mx-auto">
        <div className="flex flex-col gap-4">
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
                leading-3
              "
            >
              Food Service Manager
            </p>
          </div>

          <p className="font-medium text-xl leading-6 text-foreground-aboutBlack">
            A Cheffia é uma solução digital completa para gestão de food service
          </p>
        </div>

        <Image
          src={Frame454}
          alt="Mockup no Iphone 16 Pro"
          width={120}
          height={156}
        />
      </div>

      <p className="text-start font-inter font-normal text-base leading-5 text-foreground-aboutBlack relative z-10">
        Projetada para modernizar e simplificar operações, oferecemos uma
        experiência fluida e eficiente tanto para os clientes quanto para os
        donos de restaurantes.
      </p>

      <div className="relative flex flex-col items-center justify-center gap-1">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div
            className="
              absolute
              top-[-18%]
              left-[80%]
              h-44
              w-40
              opacity-40
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
              w-28
              top-[45%]
              left-[30%]
              transform
              -translate-x-1/2
              -translate-y-1/2
              opacity-40
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
              left-[-30%]
              h-40
              w-40
              opacity-40
              blur-3xl
              bg-neon-radial-about
              rounded-full
              z-0
            "
          />
        </div>

        <h3 className="font-medium text-2xl leading-6 text-foreground-aboutBlack relative z-10">
          Impacto esperado
        </h3>

        <div>
          <div
            className="
              w-80
              border-[1px]
              border-border-black
              rounded-xl
              px-6
              py-4
              bg-background-white
              flex
              flex-col
              gap-2
              items-center
              justify-center
              mt-4
              mx-auto
            "
          >
            <h3 className="font-inter font-semibold text-lg leading-6 text-foreground-black relative z-10">
              Para Restaurantes
            </h3>

            <div className="flex flex-col gap-3 font-inter font-medium text-sm leading-4 text-foreground-black">
              <div className="flex flex-row items-center gap-3">
                <Image
                  src={CheckIcon}
                  alt="Mockup no Iphone 16 Pro"
                  className="relative z-10"
                />
                <p className=" relative z-10">
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
              border-[1px]
              border-border-black
              rounded-xl
              px-6
              py-4
              bg-background-white
              flex
              flex-col
              gap-2
              items-center
              justify-center
              mt-4
              mx-auto
            "
          >
            <h3 className="font-inter font-semibold text-lg leading-6 text-foreground-black relative z-10">
              Para Clientes
            </h3>

            <div className="flex flex-col gap-3 font-inter font-medium text-sm leading-4 text-foreground-black">
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

      <p className="w-[270px] mt-2 font-inter font-medium text-base leading-5 text-foreground-aboutBlack relative z-10">
        Digitalize e otimize o gerenciamento de pedidos, pagamentos e operações
        financeiras em restaurantes, promovendo eficiência, redução de erros e{" "}
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

      <BurttonCta/>
    </section>
  );
}
