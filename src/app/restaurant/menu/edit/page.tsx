"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from 'next/image';
import Burguer from "@/avatars/burguer.jpg"
import { StaticImageData } from 'next/image';
import { JSX, useState } from "react";
import { AddMenuItemData } from "@/types/formTypes";
import MenuForm from "@/components/MenuContent/MenuForm";
import MenuListToEdit from "@/components/MenuContent/MenuListToEdit";

interface MenuItem {
  name: string;
  price: string;
  icon: StaticImageData;
  items: string[];
}

interface EditMenuPageProps {
  menuItems: MenuItem[];
  restaurantId: string;
}

export default function EditMenuPage({ menuItems, restaurantId } : EditMenuPageProps) {
  // const [inputNameItem, setInputNameItem] = useState('');
  // const [inputPriceItem, setInputPriceItem] = useState('');
  // const [inputItemsItem, setInputItemsItem] = useState('');
  // const [inputDescriptionItem, setInputDescriptionItem] = useState('');
  // const [inputImageItem, setInputImageItem] = useState<null | File>(null);
  const [items, setItems] = useState<string[]>([]);
  const [currentItem, setCurrentItem] = useState<string>("");

  const handleAddItem = () => {
    if (currentItem.trim() !== "") {
      setItems([...items, currentItem]);
      setCurrentItem("");
      // onChange && onChange([...items, currentItem].join(", "));
    }
  };

  const initialMenuItems: MenuItem[] = [
    {
      name: "Pizza",
      price: "10.00",
      items: ["Cheese", "Tomato", "Basil", "Dough", "Olive Oil"],
      icon: Burguer,
    },
    {
      name: "Burger",
      price: "8.00",
      items: ["Beef", "Lettuce", "Cheese"],
      icon: Burguer,
    },
    // Add more items as needed
  ];

  const handleDeleteMenuItem = (index: number) => {
    // Delete menu item
    console.log("Delete menu item");
  };

  const onSubmit = (data: AddMenuItemData) => {
    // Add menu item
    console.log("Add menu item:", data);

    // const newItem = {
    //   name: inputNameItem,
    //   price: inputPriceItem,
    //   items: inputItemsItem.split(",").map(item => item.trim()),
    //   image: inputImageItem,
    //   description: inputDescriptionItem,
    // };

    // console.log('newItem', newItem);
  };

  const handleMenuItemChange = (index: number, key: string, value: string) => {
    // Update menu item
    console.log("Update menu item");
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mt-16 shadow-md drop-shadow-4xl shadow-sidebar-primary-foreground rounded-xl">

        <CardHeader>
          <h2 className="">Edit Menu</h2>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">

            <MenuListToEdit items={initialMenuItems} />
            
            <div className="p-4 border-muted-fore border-4 rounded-xl flex flex-col gap-4">
              <h3 className="text-xl font-semibold">Add Menu Item</h3>

              <MenuForm restaurantId={"f62de497-fbd3-427b-a227-42ef11bd3c2c"} />

            </div>
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

