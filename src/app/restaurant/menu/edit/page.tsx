"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FaEdit, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import Burguer from "@/avatars/burguer.jpg"


import { StaticImageData } from 'next/image';
import { JSX } from "react";
import InputItems from "@/components/MenuContent/InputItems";
import InputPrice from "@/components/MenuContent/InputPrice";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MenuItem {
  name: string;
  price: string;
  icon: StaticImageData;
  items: string[];
}

export default function EditMenuPage(menuItems: MenuItem[]) {

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

  const handleAddMenuItem = () => {
    // Add menu item
    console.log("Add menu item");
  };

  const handleMenuItemChange = (index: number, key: string, value: string) => {
    // Update menu item
    console.log("Update menu item");
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mt-16">
        <CardHeader>
          <h2 className="">Edit Menu</h2>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
            <div className="p-4  border-muted border-4 rounded-xl">
              {initialMenuItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center flex-col items-baseline justify-between p-4 gap-4"
                >
                  <div
                    className="grid grid-cols-2 w-full"
                  >
                    <div className="flex flex-row gap-4 items-start col-span-1">

                      <div className="w-32 h-40 rounded-xl bg-hero-pattern">
                        <Image
                          src={Burguer}
                          alt={""}
                          className="rounded-xl h-full"
                        />
                      </div>

                      <div
                        className="grid grid-row-3 h-full w-28"
                      >
                        <h3 className="text-2xl font-semibold self-start">
                          {item.name}
                        </h3>

                        <div className="flex flex-col gap-1">
                          {item.items
                            .map((item, index) => (
                              <p
                                key={index}
                                className="text-base font-medium text-gray-500"
                              >
                                {item}
                              </p>
                            ))
                            .reduce((acc: JSX.Element[][], curr, index) => {
                              if (index % 3 === 0) acc.push([]);
                              acc[acc.length - 1].push(curr);
                              return acc;
                            }, [])
                            .map((row, rowIndex) => (
                              <div key={rowIndex} className="flex gap-2">
                                {row}
                              </div>
                            ))}
                        </div>

                        <p className="text-xl font-semibold self-end">
                          R$ {item.price}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 self-end items-end">
                      <Button className="rounded-xl w-24 bg-red-500 hover:bg-red-600 text-background font-bold text-lg">
                        Deletar
                      </Button>
                      <Button className="rounded-xl w-24 font-bold text-lg">
                        Editar
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-4" />
                </div>
              ))}
            </div>
            <div>
              <div className="p-4 border-muted-fore border-4 rounded-xl flex flex-col gap-4">
                <h3 className="text-xl font-semibold">Add Menu Item</h3>

                <div className="flex flex-col gap-4">

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="Name" className="pl-2">Nome do item</Label>
                    <Input
                      type="text"
                      placeholder="Pizza de marguerita"
                      className="rounded-xl h-12"
                    />
                  </div>

                  <InputPrice />

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="picture" className="pl-2">Imagem</Label>
                    <Input id="picture" type="file" className="rounded-xl" />
                  </div>
                  
                  <InputItems 
                    onChange={function (value: string): void {
                      console.log('add new item')
                    } }
                  />

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="description" className="pl-2">Descrição</Label>
                    <Textarea placeholder="Insira uma breve descrição." className="rounded-xl"/>
                  </div>

                  <div className="flex justify-end w-full">
                    <Button className="rounded-xl bg-primary text-background font-bold text-lg w-full h-14">
                      <FaEdit /> Add Menu Item
                    </Button>
                  </div>

                </div>
                
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          {/* <Button onClick={handleAddMenuItem}>
            <FaEdit /> Add Menu Item
          </Button> */}
        </CardFooter>
      </Card>
    </div>
  );


}

