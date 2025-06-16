import { Status } from "@/models/Status";

interface StatusComponentProps {
  status: Status;
  className?: string;
}

export default function StatusComponent({status, className} : StatusComponentProps) {
  const statusStyles = {
    [Status.PENDING]: "bg-yellow-500/55",
    [Status.IN_PROGRESS]: "bg-blue-500/55",
    [Status.COMPLETED]: "bg-background-green/55",
    [Status.CANCELLED]: "bg-red-500/55",
  };

  const statusText = {
    [Status.PENDING]: "Pendente",
    [Status.IN_PROGRESS]: "Cozinhando",
    [Status.COMPLETED]: "Concluído",
    [Status.CANCELLED]: "Cancelado",
  };

  return (
    <span
      className={`
        flex
        items-center
        justify-center
        px-2
        py-[2px]
        w-min
        rounded-full
        ${statusStyles[status]}
      `}
    >
      {statusText[status]}
    </span>
  );
};