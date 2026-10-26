import { Button } from "@/components/ui/button";

interface ButtonCtaProps {
  setIsModalOpen: () => void;
  label?: string;
}

export default function ButtonCta({
  setIsModalOpen,
  label = "Entrar na lista de espera",
}: ButtonCtaProps) {
  return (
    <Button
      onClick={setIsModalOpen}
      type="button"
      size="lg"
      className="font-inter"
    >
      {label}
    </Button>
  );
}
