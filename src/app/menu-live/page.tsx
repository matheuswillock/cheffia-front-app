"use client";

import MenuLive from "./container/MenuLive";
import Image from "next/image";
import Logo from "../../../public/assets/Icons/logo-horizontal.svg";
import { useEffect, useState } from "react";
import MenuLiveItem from "./container/MenuLiveItem";
import { HandleGetMenuLive } from "@/business/menuLive/menuLiveBusiness";
import { Button } from "@/components/ui/button";
import { MenuLiveOutput } from "@/models/dtos/output/MenuLive/MenuLiveOutput";
import { MenuLiveItemOutput } from "@/models/dtos/output/MenuLive/MenuLiveItemOutput";
import { GroupedMenuItemsByCategoryOutput } from "@/models/dtos/output/MenuLive/GroupedMenuItemsByCategoryOutput";
import { useCart } from "@/hooks/cartHooks/useCart";
import { HandleSendOrderToKitchen } from "@/business/order/orderBusiness";
import { useSearchParams } from "next/navigation";

export default function MenuLivePage() {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get("t");
  console.log("tableNumber", tableNumber);
  const restaurantId = searchParams.get("r");
  console.log("restaurantId", restaurantId);

  const [selectedItem, setSelectedItem] = useState<MenuLiveItemOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuLiveOutput>();
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<string[]>([]);
  const { cart, totalPrice, addToCart, clearCart } = useCart();

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  const handleItemClick = (item: MenuLiveItemOutput | null) => {
    setSelectedItem(item);
  };

  const handleBackClick = () => {
    setSelectedItem(null);
  };

  const handleAddToCart = (
    item: MenuLiveItemOutput,
    quantity: number,
    comments: string | null
  ) => {
    addToCart(item, quantity, comments);
    setSelectedItem(null);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleSendToKitchen = async () => {
    try {
      console.log(`Pedido enviado para a cozinha: ${cart} \n restaurantId: ${restaurantId} \n tableNumber: ${tableNumber}`);

      await HandleSendOrderToKitchen(cart, restaurantId ?? "", tableNumber ?? "");
      clearCart();
    } catch (error) {
      console.error("Erro ao enviar pedido para a cozinha:", error);
    }
  };

  const getMenuCategories = (menu: GroupedMenuItemsByCategoryOutput[]) => {
    const categories: string[] = [];

    console.log("GroupedMenuItemsByCategoryOutput", menu);

    menu.forEach((item) => item.name && categories.push(item.name));

    console.log("categories", categories);

    setCategories(categories);
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await HandleGetMenuLive();
        console.log("response", response);
        setMenu(response);
        console.log("menu", response);
        getMenuCategories(response.menuByCategories);
        setLoading(false);
      } catch (err) {
        setError("Erro ao carregar o menu.");
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  return (
    <>
      {selectedItem ? (
        <MenuLiveItem
          handleAddToCart={handleAddToCart}
          item={selectedItem}
          onBack={() => handleBackClick()}
        />
      ) : (
        <div className="w-screen mx-auto overflow-hidden">
          <header className="fixed top-0 left-0 w-screen h-24 sm:h-28 bg-background-default text-foreground-default z-50">
            <div className="w-full h-full px-4 flex items-center justify-between">
              <Image
                src={Logo}
                alt="Cheffia Logo"
                width={167}
                height={46}
                className="w-36 sm:w-40 md:w-44 lg:w-48 xl:w-52"
              />
              <h1 className="text-sm font-inter font-normal text-end">
                Mesa 07
              </h1>
            </div>

            <aside
              className="
              w-screen
              border-b-[1px]
              border-background-gray
              flex
              items-center
              justify-start
              bg-background-default
              overflow-x-auto
              px-4
            "
            >
              <ul className="text-sm font-inter font-normal text-foreground-footer flex gap-6 lg:gap-8 whitespace-nowrap">
                {categories.map((item, index) => (
                  <li
                    key={index}
                    className="cursor-pointer px-2 py-1 border-b-2 border-transparent hover:text-primary hover:border-primary transition-all"
                    onClick={(e) => {
                      const siblings = e.currentTarget.parentElement?.children;
                      if (siblings) {
                        Array.from(siblings).forEach((sibling) => {
                          sibling.classList.remove(
                            "text-primary",
                            "border-primary"
                          );
                          sibling.classList.add(
                            "text-foreground-footer",
                            "border-transparent"
                          );
                        });
                      }
                      e.currentTarget.classList.add(
                        "text-primary",
                        "border-primary"
                      );
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </header>

          <main className="mt-[calc(8rem)]">
            <MenuLive
              menu={menu?.menuByCategories}
              setSelectedItem={handleItemClick}
            />
          </main>

          <footer className="fixed bottom-0 left-0 w-screen h-20 sm:h-24 px-2 bg-background-default text-foreground-default flex items-center justify-between z-50 rounded-t-lg shadow-lg">
            <div className="w-full h-full bg-background-default text-foreground-default flex items-center justify-between">
              <p className="text-base font-inter font-normal">
                Total: R$ {totalPrice.toFixed(2)}
              </p>
              <Button
                onClick={handleSendToKitchen}
                disabled={cart.length === 0}
                className="w-48 text-base md:text-lg xl:text-xl h-9 sm:h-10 md:h-11 xl:h-12 font-medium font-inter text-center bg-background-green hover:bg-background-green/90 text-foreground-black rounded-lg p-2 transition-colors duration-200 flex items-center justify-center"
              >
                Enviar para cozinha
              </Button>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}