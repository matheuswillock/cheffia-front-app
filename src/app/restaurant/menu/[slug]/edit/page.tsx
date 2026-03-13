"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { useEffect, useState } from "react";
import CircleX from "@/assets/circle-x.svg";
import { handleDeleteMenuItem, handleGetAllMenuItems } from "@/business/menu/menuBusiness";
import { MenuItem } from "@/models/menuModels/MenuItem";
import { useParams } from "next/navigation";
import MenuListToEdit from "@/components/MenuContent/Edit/MenuListToEdit";
import MenuForm from "@/components/MenuContent/Edit/MenuForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function EditMenuPage() {
  const [loadError, setLoadError] = useState(false);
  const [loadErorMessage, setLoadErrorMessage] = useState("");
  const [loadingDeleteItem, setLoadingDeleteItem] = useState(false);
  const [loadingEditItem] = useState(false);
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);
  const [menuItemsList, setMenuItemsList] = useState<MenuItem[]>([]);
  const { slug } = useParams();

  const reLoadMenuItems = (success: boolean) => {
    if (success) {
      toast.success("Item adicionado com sucesso.");
      void fetchMenuItems();
      return;
    }

    toast.error("Ocorreu um erro ao adicionar o item.");
  };

  const fetchMenuItems = async () => {
    setLoadingMenuItems(true);

    try {
      const response = await handleGetAllMenuItems(slug as string);
      setMenuItemsList(response ?? []);
      setLoadError(false);
      setLoadErrorMessage("");
    } catch (error) {
      const message = "Ocorreu um erro ao carregar os itens do menu.";
      setLoadError(true);
      setLoadErrorMessage(message);
      toast.error("Falha ao carregar itens do menu", {
        description: message,
      });
      console.error("Error fetching menu items:", error);
    } finally {
      setLoadingMenuItems(false);
    }
  };

  const deleteMenuItem = async (menuItemId: string) => {
    try {
      setLoadingDeleteItem(true);
      await handleDeleteMenuItem(menuItemId);
      toast.success("Item removido com sucesso.");
      await fetchMenuItems();
    } catch (error) {
      toast.error("Erro ao deletar item", {
        description: "Tente novamente em instantes.",
      });
      console.error("Error deleting menu item:", error);
    } finally {
      setLoadingDeleteItem(false);
    }
  };

  useEffect(() => {
    void fetchMenuItems();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card className="mt-16 rounded-xl shadow-md drop-shadow-4xl shadow-sidebar-primary-foreground">
        <CardHeader>
          <h2>Edit Menu</h2>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
            {loadingMenuItems ? (
              <div className="rounded-xl border-4 border-border-default p-4">
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 rounded-xl border border-border-default p-4">
                      <Skeleton className="col-span-1 h-32 w-full rounded-xl" />
                      <div className="col-span-2 flex flex-col gap-3">
                        <Skeleton className="h-7 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <div className="col-span-1 flex flex-col items-end gap-2">
                        <Skeleton className="h-10 w-24 rounded-xl" />
                        <Skeleton className="h-10 w-24 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
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

            <div className="flex flex-col gap-4 rounded-xl border-4 border-muted-fore p-4">
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
