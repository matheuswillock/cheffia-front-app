import { ApresentationItem } from "@/components/ApresentationItem";
import QrCodeIcon from "@/assets/qr-code.svg";
import CreditCard from "@/assets/credit-card.svg";
import ClipboardList from "@/assets/clipboard-list.svg";

export function ApresentationSection() {
  const items = [
    {
      title: "QR Code Personalizado",
      description:
        "Cada restaurante recebe um QR code único para fácil acesso ao menu digital.",
      icon: QrCodeIcon,
    },
    {
      title: "Pedidos Digitais",
      description:
        "Clientes fazem pedidos diretamente pelo smartphone, reduzindo erros e agilizando o processo.",
      icon: ClipboardList,
    },
    {
      title: "Pagamento Integrado",
      description:
        "Diversas opções de pagamento digital, incluindo Pix, NuPay, SamsungPay, Apple Pay e Google Pay.",
      icon: CreditCard,
    },
  ];

  return (
    <section className="features py-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((item, index) => (
          <ApresentationItem
            Key={index}
            ItemTitle={item.title}
            ItemDescription={item.description}
            imagePath={item.icon}
          />
        ))}
      </div>
    </section>
  );
}
