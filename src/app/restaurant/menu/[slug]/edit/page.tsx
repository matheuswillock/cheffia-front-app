"use client";

import Image from 'next/image';
import { useEffect, useState } from "react";
import LoadingSpin from "@/assets/loading-spin.svg";
import CircleX from "@/assets/circle-x.svg";
import { handleDeleteMenuItem, handleGetAllMenuItems } from "@/business/menu/menuBusiness";
import { MenuItem } from "@/models/menuModels/MenuItem";
import { useParams } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Category } from "@/models/menuModels/Category";
import MenuForm from './container/MenuForm';
import MenuListToEdit from './container/MenuListToEdit';

export default function EditMenuPage() {
  const [loadError, setLoadError] = useState(false);
  const [loadErorMessage, setLoadErrorMessage] = useState("");
  const [loadingDeleteItem, setLoadingDeleteItem] = useState(false);
  const [loadingEditItem, setLoadingEditItem] = useState(false);
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);
  const [menuItemsList, setMenuItemsList] = useState<MenuItem[]>(new Array<MenuItem>());
  const [menuCategories, setMenuCategories] = useState<Category[]>(
    new Array<Category>()
  );
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState('');
  const {slug} = useParams();

  const reLoadMenuItems = (success: boolean) => {
    if (success) {
      setShowSuccessMessage("Item adicionado com sucesso.");
      setShowSuccessAlert(true);
      fetchMenuItems();
      return;
    }
    setShowErrorMessage("Ocorreu um erro ao adicionar o item.");
    setShowErrorAlert(true);
    setLoadingMenuItems(false);
  }

  const fetchMenuItems = async () => {
    setLoadingMenuItems(true);
    try {
      const response = await handleGetAllMenuItems(slug as string);
      setMenuItemsList(response.items);
      console.log("Menu items fetched successfully:", response.items);
      setMenuCategories(response.categories);
      console.log("Menu categories fetched successfully:", response.categories);
      setLoadingMenuItems(false);
    } catch (error) {
      setLoadError(true);
      setLoadErrorMessage("Ocorreu um erro ao carregar os itens do menu.");
      console.error("Error fetching menu items:", error);
      setLoadingMenuItems(false);
    }
  };

  const handleMenuItemChange = (index: number, key: string, value: string) => {
    console.log("Update menu item");
  };

  const deleteMenuItem = async (menuItemId: string) => {
    try {
      setLoadingDeleteItem(true);
      await handleDeleteMenuItem(menuItemId);
      setLoadingDeleteItem(false);
      setShowSuccessMessage("Item deletado com sucesso.");
      fetchMenuItems();
    }catch (error) {
      console.error("Error deleting menu item:", error);
      // TODO: Show error message
      setLoadingDeleteItem(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  return (
    <div className="w-screen px-4 py-8">
      <div className="w-full border-none gap-4 flex flex-col items-center justify-center sm:max-w-[560px] md:max-w-[640px] lg:max-w-[720px] xl:max-w-[820px] mx-auto">
        <header className="flex flex-col gap-2 w-full lg:flex-row lg:justify-between lg:items-center">
          <h2 className="font-semibold text-3xl xl:text-4xl">Cardápio</h2>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                className="
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
                  hover:bg-background-green/60
                  text-foreground-black
                  rounded-lg
                  p-2
                  transition-colors
                  duration-200
                "
              >
                + Adicionar novo item ao cardápio
              </Button>
            </SheetTrigger>
            <SheetContent>
              <MenuForm
                setLoadingMenuItems={setLoadingMenuItems}
                restaurantId={slug as string}
                menuCategories={menuCategories}
                reloadMenuItemsList={(success: boolean) => reLoadMenuItems(success)}
              />
            </SheetContent>
          </Sheet>
        </header>

        <div className="flex flex-col gap-4 w-full bg-background-card rounded-lg min-h-96 md:min-h-[480px] lg:min-h-[560px]">
          <div className="w-full h-full flex flex-col items-center justify-center mx-auto ">
            {loadingMenuItems ? (
              <div className="flex items-center justify-center h-full mt-32">
                <Image
                  src={LoadingSpin}
                  alt="Loading"
                  className="h-32 w-32 animate-spin flex items-end justify-center"
                />
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <Image
                  src={CircleX}
                  alt={"Erro ao carregar os itens do menu"}
                  className="h-32 w-32"
                />
                <h3 className="text-xl font-semibold">{loadErorMessage}</h3>
              </div>
            ) : (
              <MenuListToEdit
                items={menuItemsList}
                handleDeleteButton={deleteMenuItem}
                loadingButtonDeleteItem={loadingDeleteItem}
                loadingButtonEditItem={loadingEditItem}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

