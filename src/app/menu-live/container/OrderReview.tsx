import { Button } from "@/components/ui/button";
import Image, { StaticImageData } from "next/image";
import Logo from "../../../../public/assets/Icons/logo-horizontal.svg";
import CloseTabIcon from "../../../../public/assets/Icons/scroll-text.svg";
import { useEffect } from "react";
import ImageOff from "@/assets/image-off.svg";
import { CartItem } from "@/hooks/cartHooks/CartItem";
import MenuHeader from "@/components/MenuContent/MenuHeader";

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
    <div className="flex flex-col items-center h-full">
      {/* <header className="fixed top-0 left-0 w-screen h-24 sm:h-28 bg-background-default text-foreground-default z-50">
        <div className="w-full h-full px-4 flex items-center justify-between">
          <Image
            src={Logo}
            alt="Cheffia Logo"
            width={167}
            height={46}
            className="w-36 sm:w-40 md:w-44 lg:w-48 xl:w-52"
          />

          <div className="flex items-center justify-between gap-2">
            <h1 className="text-sm font-inter font-normal text-end">
              Mesa {tableNumber}
            </h1>
            <Button
              className="bg-transparent hover:bg-transparent text-foreground-default p-0 m-0"
              onClick={() => setShowCloseTab(true)}
            >
              <Image
                src={CloseTabIcon}
                alt="Fechar conta"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </Button>
          </div>
        </div>

        <aside>
          <Button
            onClick={() => {
              setShowOrderReview(false);
              onClose(true);
            }}
            className=" text-lg md:text-lg xl:text-xl h-9 sm:h-10 md:h-11 xl:h-12 font-medium font-inter text-center bg-transparent text-white hover:bg-transparent rounded-lg p-2 transition-colors duration-200 flex items-center justify-center"
          >
            Voltar ao menu
          </Button>
        </aside>
      </header> */}
      
      <MenuHeader
        setShowOrderReview={setShowOrderReview}
        setShowCloseTab={setShowCloseTab}
        tableNumber={tableNumber}
        onClose={onClose}
      />

      <main className="w-screen overflow-hidden pb-20 sm:pb-24 mt-[calc(8rem)]">
        <ul className="space-y-4">
          {cart.map((item) => (
            <li
              className="border-b pb-3 flex flex-row pl-4 pr-1 items-center cursor-pointer active:bg-background-card"
              key={item.id}
            >
              <div className="text-sm font-inter font-normal flex-1">
                <p className="font-medium text-base">{item.name}</p>
                {/* <p className="text-gray-500">
                  {item.description.length > 56
                    ? `${item.description.slice(0, 56)}...`
                    : item.description}
                </p> */}
                <div className="flex justify-between items-center mt-2">
                  <p className="text-green-600 font-bold">
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
    </div>
  );
}