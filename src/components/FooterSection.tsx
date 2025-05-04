import Link from "next/link";
import Image from 'next/image';
import CheffiaWhiteIcon from "../../public/assets/Icons/simbolo-branco.svg";
import WhatsappIcon from "../../public/assets/Icons/whatsapp-icon.svg";
import InstagramIcon from "../../public/assets/Icons/instagram-icon.svg";
import EmailIcon from "../../public/assets/Icons/email-icon.svg"

export default function FooterSection () {
  return (
    <section
      className="
        bg-background-default
        -mt-12
        py-14
        px-8
        md:px-16
        flex
        flex-col
        md:flex-row
        items-start
        md:items-center
        gap-12
        justify-start
        md:justify-center
        overflow-hidden
      "
    >
      <Image
        src={CheffiaWhiteIcon}
        alt="Icone Branco do Cheffia"
        width={42}
        height={50}
        className="w-[42] h-[50] md:w-[43] md:h-[51] xl:w-[45.85] xl:h-[57]"
      />

      <div className="flex flex-row gap-8 items-center justify-between h-full w-full">
        <div
          className="
            font-inter
            font-medium
            text-sm
            xl:text-base
            leading-4
            text-foreground-footer
            flex
            flex-col
            md:flex-row
            gap-5
            text-start
            lg:text-center
            lg:justify-center
            w-full
          "
        >
          <Link href={""}>SOBRE O CHEFFIA</Link>
          <Link href={""}>REGISTRAR UMA DÚVIDA</Link>
          <Link href={""}>FUNCIONALIDADES</Link>
        </div>

        <div className="flex flex-col lg:flex-row flex-start justify-start gap-4">
          <Link
            href={
              "https://wa.me/+5511988859573/?text=Ol%C3%A1%2C+eu+tenho+uma+d%C3%BAvida%21"
            }
          >
            <Image
              src={WhatsappIcon}
              width={28}
              height={29}
              alt={"Whatsapp"}
              className="w-[23.3] h-[24] lg:w-[28] lg:h-[29] xl:w-[32] xl:h-[33]"
            />
          </Link>
          <Link href={"mailto:contato@cheffia.com"}>
            <Image
              src={EmailIcon}
              width={28}
              height={29}
              alt={"Email"}
              className="w-[23.3] h-[24] lg:w-[28] lg:h-[29] xl:w-[32] xl:h-[33]"
            />
          </Link>
          <Link
            href={
              "https://www.instagram.com/cheffia.app?igsh=MXV4MmhvYzZ2NmpzcQ=="
            }
          >
            <Image
              src={InstagramIcon}
              width={28}
              height={29}
              alt={"Instagram"}
              className="w-[23.3] h-[24] lg:w-[28] lg:h-[29] xl:w-[32] xl:h-[33]"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};