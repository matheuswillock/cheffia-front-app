import CloseTabIcon from "../../../../public/assets/Icons/scroll-text.svg";
import Image from "next/image";
import Logo from "../../../../public/assets/Icons/logo-horizontal.svg";
import { Button } from "@/components/ui/button";
import MenuHeader from "@/components/MenuLiveContent/MenuHeader";
import MenuFooter from '../../../components/MenuLiveContent/MenuFooter';
import { CartItem } from "@/hooks/cartHooks/CartItem";

interface CloseTabProps {
  tableNumber: string;
  onClose: (value: boolean) => void;
  setShowCloseTab: (value: boolean) => void;
  setShowOrderReview: (value: boolean) => void;
}

// TODO: Implementar um get no backend para buscar os items do cliente que já foram adicionados ao carrinho e enviados para a cozinha

export default function CloseTab({ tableNumber, onClose, setShowCloseTab, setShowOrderReview }: CloseTabProps) {

  const items: CartItem[] = [
    {
      id: "1",
      orderId: "12345",
      name: "Pizza Margherita",
      description: "Deliciosa pizza com molho de tomate, queijo e manjericão",
      ingredients: ["Molho de tomate", "Queijo", "Manjericão"],
      mediaImgixUrl: "https://example.com/pizza-margherita.jpg",
      mediaUrl: "https://example.com/pizza-margherita.jpg",
      quantity: 1,
      comments: "Sem cebola",
      price: 42.9,
    },
    {
      id: "2",
      orderId: "12346",
      name: "Coca-Cola 350ml",
      description: "Refrigerante clássico",
      ingredients: ["Água gaseificada", "Açúcar", "Corante"],
      mediaImgixUrl: "https://example.com/coca-cola.jpg",
      mediaUrl: "https://example.com/coca-cola.jpg",
      quantity: 2,
      comments: "Sem gelo",
      price: 7.0,
    },
    {
      id: "3",
      orderId: "12347",
      name: "Brownie",
      description: "Delicioso brownie de chocolate",
      ingredients: ["Chocolate", "Farinha", "Açúcar", "Ovos"],
      mediaImgixUrl: "https://example.com/brownie.jpg",
      mediaUrl: "https://example.com/brownie.jpg",
      quantity: 1,
      comments: "Com sorvete de creme",
      price: 15.0,
    },
  ];

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="w-screen mx-auto overflow-hidden">

      <MenuHeader
        setShowOrderReview={setShowOrderReview}
        setShowCloseTab={setShowCloseTab}
        tableNumber={tableNumber}
        onClose={onClose}
      />

      <main className="w-screen overflow-hidden pb-20 sm:pb-24 mt-36">
        {items.map((item) => (
          <div
            key={item.id}
            className="border-b py-3 flex flex-row pl-4 pr-1 items-center cursor-pointer active:bg-white"
          >
            <div className="text-sm font-inter font-normal flex-1">
              <p className="font-medium text-base">
                <span>{item.quantity}x</span>
                <span className="ml-2">{item.name}</span>
              </p>
              <p className="text-foreground-card">{item.comments}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-foreground-green font-bold">
                  R$ {item.price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </main>

      <MenuFooter
        totalPrice={total}
        cart={items}
        nextStep={function (value: boolean): void {
          throw new Error("Function not implemented.");
        }}
        nextStepName={"Fechar Conta"}
      />
    </div>
  );
}
