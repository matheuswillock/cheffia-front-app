import { Button } from "../ui/button";
import Image, { StaticImageData } from "next/image";
import Logo from "../../../public/assets/Icons/logo-horizontal.svg";
import CloseTabIcon from "../../../public/assets/Icons/scroll-text.svg";

interface MenuHeaderProps {
  setShowCloseTab: (value: boolean) => void;
  tableNumber: string;
  onClose: (value: boolean) => void;
  setShowOrderReview: (value: boolean) => void;
}

export default function MenuHeader({ setShowCloseTab, tableNumber, onClose, setShowOrderReview }: MenuHeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-screen h-24 sm:h-28 bg-background-default text-foreground-default z-50">
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
          onClose(true);
          setShowOrderReview(false);
          setShowCloseTab(false);
        }}
        className=" text-lg md:text-lg xl:text-xl h-9 sm:h-10 md:h-11 xl:h-12 font-medium font-inter text-center bg-transparent text-white hover:bg-transparent rounded-lg p-2 transition-colors duration-200 flex items-center justify-center"
      >
        Voltar ao menu
      </Button>
    </aside>
  </header>
);
}