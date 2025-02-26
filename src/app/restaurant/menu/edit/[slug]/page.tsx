"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from 'next/image';
import { useEffect, useState } from "react";
import MenuForm from "@/components/MenuContent/MenuForm";
import MenuListToEdit from "@/components/MenuContent/MenuListToEdit";
import LoadingSpin from "@/assets/loading-spin.svg";
import CircleX from "@/assets/circle-x.svg";
import { handleDeleteMenuItem, handleGetAllMenuItems } from "@/services/restaurant/menu/menuBusiness";
import { MenuItem } from "@/models/menuModels/MenuItem";
import { useParams } from "next/navigation";

export default function EditMenuPage() {
  const [loadError, setLoadError] = useState(false);
  const [loadErorMessage, setLoadErrorMessage] = useState("");
  const [loadingDeleteItem, setLoadingDeleteItem] = useState(false);
  const [loadingEditItem, setLoadingEditItem] = useState(false);
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);
  const [menuItemsList, setMenuItemsList] = useState<MenuItem[]>(new Array<MenuItem>());
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
  }

  const fetchMenuItems = async () => {
    setLoadingMenuItems(true);
    try {
      const response = await handleGetAllMenuItems(slug as string);

      if (response && response.length > 0) {
        setMenuItemsList(response);      
      } 

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
    <div className="container mx-auto p-4">
      <Card className="mt-16 shadow-md drop-shadow-4xl shadow-sidebar-primary-foreground rounded-xl">

        <CardHeader>
          <h2 className="">Edit Menu</h2>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">

            {loadingMenuItems ? (
              <div className="flex items-center justify-center">
                <Image
                  src={LoadingSpin}
                  alt="Loading"
                  className="h-32 w-32 animate-spin"
                />
              </div>

            ) : loadError ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <Image 
                  src={CircleX} 
                  alt={"Erro ao carregar os itens do menu"} 
                  className="h-32 w-32"
                />      
                <h3 className="text-xl font-semibold">
                  {loadErorMessage}
                </h3>
              </div>
            ) : (
              <MenuListToEdit 
                items={menuItemsList}      
                handleDeleteButton={deleteMenuItem}
                loadingButtonDeleteItem={loadingDeleteItem}
                loadingButtonEditItem={loadingEditItem}
              />
            )}

            <div className="p-4 border-muted-fore border-4 rounded-xl flex flex-col gap-4">
              <h3 className="text-xl font-semibold">Add Menu Item</h3>
              <MenuForm 
                restaurantId={slug as string} 
                reloadMenuItemsList={(success: boolean) => reLoadMenuItems(success)}
              />
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}

