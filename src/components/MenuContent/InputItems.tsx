"use client";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import Image from 'next/image';
import Plus from "@/assets/plus.svg";
import { JSX, useState } from "react";
import { Badge } from "../ui/badge";
import BadgeItems from "./BadgeItems";
import { Label } from "../ui/label";

interface InteractiveInputProps {
  onChange: (value: string) => void;
}

export default function InputItems({ onChange }: InteractiveInputProps) {
  const [items, setItems] = useState<string[]>([]);
  const [currentItem, setCurrentItem] = useState<string>("");

  const handleAddItem = () => {
    if (currentItem.trim() !== "") {
      setItems([...items, currentItem]);
      setCurrentItem("");
      onChange([...items, currentItem].join(", "));
    }
  };

  return (
    <div className="flex w-full items-center space-x-2 flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 w-full">
        <div className=" col-span-2 flex flex-col gap-2 w-full">
          <Label>Items</Label>
          <Input
            type="text"
            placeholder="Insira os Ingredientes"
            className="rounded-xl h-12"
            value={currentItem}
            onChange={(e) => {
              setCurrentItem(e.target.value);
            }}
          />
        </div>

        <div className="col-span-1 w-full flex items-end">
          <Button 
            className="rounded-xl bg-primary text-background font-bold text-lg w-full h-12"
            onClick={handleAddItem}
          >
            <Image src={Plus} alt={"Adicionar um ingrediente ao item do Menu"} /> Add Item
          </Button>
        </div>


      </div>

      <div className="flex w-full items-center ">
        {items.map((item, index) => (
          <BadgeItems 
            item={item}
            index={index} 
            handleDelete={(index: number) => {
              const newItems = items.filter((_, i) => i !== index);
              setItems(newItems);
              onChange(newItems.join(", "));
            }}          
          />
        ))}
      </div>
    </div>
  );
}