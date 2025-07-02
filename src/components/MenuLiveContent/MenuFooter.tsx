import { CartItem } from "@/hooks/cartHooks/CartItem";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

interface MenuFooterProps {
  totalPrice: number;
  cart: CartItem[];
  nextStep: (value: boolean) => void;
  nextStepName: string;
}


export default function MenuFooter({ totalPrice, cart, nextStep, nextStepName }: MenuFooterProps) {
  const [totalItems, setTotalItems] = useState<number>(0);

  useEffect(() => {
    const total = cart.reduce((acc, item) => acc + item.quantity, 0);
    setTotalItems(total);
  }, [cart]);

  return (
    <footer className="fixed bottom-0 left-0 w-screen h-20 sm:h-24 px-4 bg-background-default text-foreground-default flex items-center justify-between z-50 shadow-lg border-t-[1px] border-background-gray">
      <div className="w-full h-full bg-background-default text-foreground-default flex items-center justify-between">
        <div className=" font-inter font-normal flex flex-col items-start justify-center">
          <p className="text-foreground-card text-base">Total</p>
          <p className="text-foreground-default flex items-center gap-1">
            <span className="text-lg font-bold">
              R$ {totalPrice.toFixed(2)}{" "}
            </span>
            <span className="text-foreground-card text-sm">
              / {totalItems} {totalItems > 1 ? "itens" : "item"}
            </span>
          </p>
        </div>
        <Button
          onClick={() => nextStep(true)}
          disabled={cart.length === 0}
          className="w-48 text-lg md:text-lg xl:text-xl h-9 sm:h-10 md:h-11 xl:h-12 font-medium font-inter text-center bg-background-green hover:bg-background-green/90 text-foreground-black rounded-lg p-2 transition-colors duration-200 flex items-center justify-center"
        >
          {nextStepName}
        </Button>
      </div>
    </footer>
  );
}