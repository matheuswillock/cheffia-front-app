import Link from "next/link";
import Image from 'next/image';
import CheffiaWhiteIcon from "../../public/assets/Icons/simbolo-branco.png";
import WhatsappIcon from "../../public/assets/Icons/whatsapp-icon.svg";
import InstagramIcon from "../../public/assets/Icons/instagram-icon.svg";
import EmailIcon from "../../public/assets/Icons/email-icon.svg"

export default function FooterSection () {
  return (
    <section className="bg-background-default -mt-12 py-14 px-8 flex flex-col items-start gap-12 justify-start overflow-hidden">
      <Image
        src={CheffiaWhiteIcon}
        alt="Icone Branco do Cheffia"
        width={42}
        height={50}
        className=""
      />

      <div className="flex flex-row gap-8 items-center justify-between w-full">
        <div className="font-inter font-medium text-sm leading-4 text-foreground-footer flex flex-col gap-5 text-start">
          <Link href={""}>SOBRE O CHEFFIA</Link>
          <Link href={""}>REGISTRAR UMA DÚVIDA</Link>
          <Link href={""}>FUNCIONALIDADES</Link>
        </div>

        <div className="flex flex-col flex-start justify-start gap-4">
          <Link href={""}>
            <Image src={WhatsappIcon} width={28} height={29} alt={"Whatsapp"} />
          </Link>
          <Link href={""}>
            <Image src={EmailIcon} width={28} height={29} alt={"Whatsapp"} />
          </Link>
          <Link href={""}>
            <Image
              src={InstagramIcon}
              width={28}
              height={29}
              alt={"Whatsapp"}
            />
          </Link>
        </div>
      </div>
    </section>
  );

};