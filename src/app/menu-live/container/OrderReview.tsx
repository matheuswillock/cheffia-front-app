import { Button } from "@/components/ui/button";
import Image, { StaticImageData } from "next/image";
import Logo from "../../../../public/assets/Icons/logo-horizontal.svg";
import CloseTabIcon from "../../../../public/assets/Icons/scroll-text.svg";
import { useEffect } from "react";
import ImageOff from "@/assets/image-off.svg";
import { CartItem } from "@/hooks/cartHooks/CartItem";
import MenuHeader from "@/components/MenuLiveContent/MenuHeader";
import MenuFooter from "@/components/MenuLiveContent/MenuFooter";

interface OrderReviewProps {
  setShowOrderReview: (value: boolean) => void;
  sendToKitchen: () => Promise<void>;
  setShowCloseTab: (value: boolean) => void;
  tableNumber: string;
  onClose: (value: boolean) => void;
  cart: CartItem[];
  totalPrice: number;
  clearCart: () => void;
  restaurantId: string | null;
}

// TODO: Implementar a lógica de revisão do pedido e envio para a cozinha

export default function OrderReview({
  setShowOrderReview, sendToKitchen, setShowCloseTab, tableNumber, onClose, cart, totalPrice, clearCart, restaurantId
}: OrderReviewProps) {

  useEffect(() => {
    console.log("OrderReview", cart);
    console.log("Total Price", totalPrice);
  }, [cart, totalPrice]);

  return (
    <div className="w-screen mx-auto overflow-hidden">
      <MenuHeader
        setShowOrderReview={setShowOrderReview}
        setShowCloseTab={setShowCloseTab}
        tableNumber={tableNumber}
        onClose={onClose}
      />

      <main className="w-screen overflow-hidden pb-20 sm:pb-24 mt-40">
        <ul className="space-y-4">
          {cart.map((item) => (
            <li
              className="border-b pb-3 flex flex-row pl-4 pr-1 items-center cursor-pointer active:bg-background-card"
              key={item.id}
            >
              <div className="text-sm font-inter font-normal flex-1">
                <p className="font-medium text-base">
                  <span>{item.quantity}x</span>
                  <span className="ml-2">{item.name}</span>
                </p>
                <p className="text-foreground-card">
                  {item.comments || "Sem observações"}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-foreground-green font-bold">
                    R$ {item.price.toFixed(2)}
                  </p>
                </div>
              </div>
              <Image
                src={item.mediaUrl || (ImageOff as StaticImageData)}
                alt={item.name}
                width={128}
                height={160}
                className="w-16 h-16 sm:w-28 sm:h-28 md:w-24 md:h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 rounded-md flex-shrink-0 object-cover "
              />
            </li>
          ))}
        </ul>
      </main>

      {/* TODO: Implementar a lógica de envio para a cozinha */}
      <MenuFooter
        totalPrice={totalPrice}
        cart={cart}
        nextStep={setShowOrderReview} // TODO: Ajustar a lógica de envio para a cozinha
        nextStepName="Enviar para Cozinha"
      />
    </div>
  );
}