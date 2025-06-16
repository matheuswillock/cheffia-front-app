import { MenuItem } from "@/models/menuModels/MenuItem";
import Image, { StaticImageData } from "next/image";
import ImageOff from "@/assets/image-off.svg";
import IconLeft from "../../../../public/assets/Icons/icon-left.svg"
import { useState } from "react";
import IconMinus from "../../../../public/assets/Icons/icon-minus.svg"
import IconPlus from "../../../../public/assets/Icons/icon-plus.svg"
import { Button } from "@/components/ui/button";
import { MenuLiveItemOutput } from "@/models/dtos/output/MenuLive/MenuLiveItemOutput";
import { Textarea } from "@/components/ui/textarea";

interface MenuLiveItemProps {
  item: MenuLiveItemOutput;
  onBack: () => void;
  handleAddToCart: (item: MenuLiveItemOutput, quantity: number, comments: string | null) => void;
}

export default function MenuLiveItem({ item, onBack, handleAddToCart }: MenuLiveItemProps) {
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(item.price);
  const [comments, setComments] = useState<string | null>(null);

  const handleIncrement = () => {
    setQuantity(quantity + 1);
    setTotalPrice((quantity + 1) * item.price);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      setQuantity(quantity - 1);
      setTotalPrice((quantity - 1) * item.price);
    }
  };

  return (
    <div className="w-screen h-full flex flex-col">
      <Image
        src={item.mediaUrl || (ImageOff as StaticImageData)}
        width={256}
        height={256}
        alt={""}
        className="object-cover w-full h-64"
      />

      <button
        onClick={onBack}
        className="fixed top-8 left-4 bg-black rounded-full z-50"
      >
        <Image
          src={IconLeft}
          alt="Back"
          width={48}
          height={48}
          className=""
        />
      </button>

      <main className="w-full bg-background-gray -mt-3 flex-1 p-4 pb-24 sm:pb-24 rounded-t-xl flex flex-col gap-4">
        <div className="w-full">
          <h1 className="text-2xl font-inter font-semibold">{item.name}</h1>
          <p className=" font-inter text-foreground-white font-light text-base leading-[18px] mt-2">
            {item.description}
          </p>
          <p className="text-green-600 font-inter text-base font-semibold mt-4">
            R$ {item.price.toFixed(2)}
          </p>
        </div>

        <Textarea
          rows={6}
          placeholder="Adicione uma observação"
          className="bg-background-card"
          onChange={(e) => setComments(e.target.value)}
          value={comments || ""}
        />
      </main>

      <footer
        className="
          fixed
          bottom-0
          left-0
          w-screen
          h-20
          sm:h-24
          px-2
          bg-background-default
          text-foreground-default
          flex
          items-center
          justify-between
          z-50
          rounded-t-lg
          shadow-lg
        "
      >
        <div className="w-full h-full bg-background-default text-foreground-default flex items-center justify-between">
          <div className="text-base font-inter font-normal w-[94px] flex items-center justify-between rounded-lg">
            <Image
              onClick={handleDecrement}
              src={IconMinus}
              alt={"Incrementar item"}
              className="cursor-pointer w-6"
            />
            <span className="font-inter text-foreground-pureWhite font-bold text-xl">
              {quantity}
            </span>

            <Image
              onClick={handleIncrement}
              src={IconPlus}
              alt={"Incrementar item"}
              className="cursor-pointer w-6"
            />
          </div>

          <Button
            onClick={() => handleAddToCart(item, quantity, comments)}
            disabled={quantity === 0}
            className="
              w-48
              text-base
              md:text-lg
              xl:text-xl
              h-9
              sm:h-10
              md:h-11
              xl:h-12
              font-medium
              font-inter
              text-center
              bg-background-green
              hover:bg-background-green/90
              text-foreground-black
              rounded-lg
              p-2
              transition-colors
              duration-200
              flex
              items-center
              justify-between
            "
          >
            <span>Adicionar</span>
            <span>R$ {totalPrice.toFixed(2)}</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}