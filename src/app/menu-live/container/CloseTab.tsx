import CloseTabIcon from "../../../../public/assets/Icons/scroll-text.svg";
import Image from "next/image";
import Logo from "../../../../public/assets/Icons/logo-horizontal.svg";
import { Button } from "@/components/ui/button";
import MenuHeader from "@/components/MenuContent/MenuHeader";

interface CloseTabProps {
  tableNumber: string;
  onClose: (value: boolean) => void;
  setShowCloseTab: (value: boolean) => void;
  setShowOrderReview: (value: boolean) => void;
}

// TODO: Implementar um get no backend para buscar os items do cliente que já foram adicionados ao carrinho e enviados para a cozinha

export default function CloseTab({ tableNumber, onClose, setShowCloseTab, setShowOrderReview }: CloseTabProps) {

  const items = [
    {
      id: 1,
      name: "Pizza Margherita",
      quantity: 1,
      comments: "Sem cebola",
      price: 42.9,
    },
    {
      id: 2,
      name: "Coca-Cola 350ml",
      quantity: 2,
      comments: "Sem gelo",
      price: 7.0,
    },
    {
      id: 3,
      name: "Brownie",
      quantity: 1,
      comments: "Com sorvete de creme",
      price: 15.0,
    },
  ];

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="w-screen mx-auto overflow-hidden">
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
            <Image
              src={CloseTabIcon}
              alt="Fechar conta"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </div>
        </div>

        <aside>
          <Button
            onClick={() => onClose(true)}
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
              <p className="text-gray-500">{item.comments}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-green-600 font-bold">
                  R$ {item.price.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="fixed bottom-0 left-0 w-screen h-20 sm:h-24 px-4 bg-background-default text-foreground-default flex items-center justify-between z-50 rounded-t-lg shadow-lg">
        <div className="w-full h-full bg-background-default text-foreground-default flex items-center justify-between">
          <p className="text-lg font-inter font-normal">
            Total: {total.toFixed(2)}
          </p>
          <Button className="w-full text-lg md:text-lg xl:text-xl h-9 sm:h-10 md:h-11 xl:h-12 font-medium font-inter text-center bg-background-green hover:bg-background-green/90 text-foreground-black rounded-lg p-2 transition-colors duration-200 flex items-center justify-center">
            Fechar Conta
          </Button>
        </div>
      </footer>
    </div>
  );
}
