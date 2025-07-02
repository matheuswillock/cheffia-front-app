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
import CloseTabIcon from "../../../public/assets/Icons/scroll-text.svg";
import CloseTab from "./container/CloseTab";
import OrderReview from "./container/OrderReview";
import MenuFooter from "@/components/MenuLiveContent/MenuFooter";

export default function MenuLivePage() {
  const searchParams = useSearchParams();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuLiveOutput>();
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<string[]>([]);
  const { cart, totalPrice, addToCart, clearCart } = useCart();
  const [showCloseTab, setShowCloseTab] = useState(false);
  const [showOrderReview, setShowOrderReview] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuLiveItemOutput | null>(
    null
  );

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
        const r = searchParams.get("r");
        const t = searchParams.get("t");

        if (!r || !t) {
          setError("Parâmetros do restaurante ou mesa não fornecidos.");
          setLoading(false);
          return;
        }

        setRestaurantId(r);
        setTableNumber(t);
        setLoading(true);
        setError(null);

        const response = await HandleGetMenuLive(r, t);
        setMenu(response);
        getMenuCategories(response.menuByCategories);
      } catch (err) {
        console.error("Erro ao carregar o menu:", err);
        setError("Erro ao carregar o menu.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [searchParams]);

  return (
    <>
      {showCloseTab ? (
        <CloseTab
          tableNumber={tableNumber ?? ""}
          onClose={() => setShowCloseTab(false)}
          setShowCloseTab={setShowCloseTab}
          setShowOrderReview={setShowOrderReview}
        />
      ) : selectedItem ? (
        <MenuLiveItem
          handleAddToCart={handleAddToCart}
          item={selectedItem}
          onBack={() => handleBackClick()}
        />
      ) : showOrderReview ? (
        <OrderReview
          setShowOrderReview={setShowOrderReview}
          sendToKitchen={handleSendToKitchen}
          tableNumber={tableNumber ?? ""}
          setShowCloseTab={setShowCloseTab}
          onClose={() => setShowOrderReview(false)}
          cart={cart}
          totalPrice={totalPrice}
          clearCart={handleClearCart}
          restaurantId={restaurantId ?? ""}
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
              loading={loading}
              menu={menu?.menuByCategories}
              setSelectedItem={handleItemClick}
            />
          </main>

          <MenuFooter
            totalPrice={totalPrice}
            cart={cart}
            nextStep={setShowOrderReview}
            nextStepName="Ver Bandeja"
          />
        </div>
      )}
    </>
  );
}