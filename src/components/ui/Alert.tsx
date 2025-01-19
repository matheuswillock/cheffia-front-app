import { Slide } from "@mui/material";
import Image from "next/image";
import BadgeCheck from "@/assets/badge-check.svg";
import CircleX from "@/assets/circle-x.svg";
import X from "@/assets/x.svg";
import { Button } from "./button";

interface AlertProps {
  IsOpen : boolean;
  SetCloseAlert: (value: boolean) => void;
  Title: string;
  Message: string;
  type: "success" | "fail";
}

export default function Alert({ SetCloseAlert, Title, Message, type, IsOpen}: AlertProps) {
  const icon = type === "success" ? BadgeCheck : CircleX;

  return (
    <Slide direction="up" in={IsOpen}>
      <div
        className={`${
          type === "success"
            ? "border-primary bg-primary-foreground"
            : "border-destructive bg-red-700"
        } flex flex-row justify-between gap-4 border-[3px] rounded-xl h-36 px-6 fixed transform -translate-x-1/2 w-11/12 max-w-2xl z-50 margin-auto `}
        style={{}}
      >
        <Image
          src={icon}
          alt={
            type === "success" ? "Certificado de check" : "Erro ao cadastrar"
          }
          className="flex-shrink-0"
        />

        <div className="flex flex-col items-start gap-2 flex-grow justify-center">
          <div className="text-4xl font-bold">{Title}</div>
          <div className="text-2xl text-muted-foreground">{Message}</div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-10 h-10 mt-[2.15rem]"
          onClick={() => SetCloseAlert(false)}
        >
          <Image src={X} alt={"botão para fechar o alerta"} />
        </Button>
      </div>
    </Slide>
  );
}