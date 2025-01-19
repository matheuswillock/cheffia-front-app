"use client";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import BadgeItems from "./BadgeItems";
import { Label } from "../ui/label";
import { FaPlus } from "react-icons/fa";
import { ControllerRenderProps } from "react-hook-form";
import { AddMenuItemData } from "@/types/formTypes";

interface InteractiveInputProps {
  onChange?: (value: string) => void;
  controlProps: ControllerRenderProps<AddMenuItemData, "ingredients">
  handleBlur?: () => void;
}

export default function InputItems({ onChange, controlProps, handleBlur }: InteractiveInputProps) {
  const [items, setItems] = useState<string[]>([]);
  const [currentItem, setCurrentItem] = useState<string>("");

  const handleAddItem = () => {
    if (currentItem.trim() !== "") {
      setItems([...items, currentItem]);
      setCurrentItem("");
      onChange && onChange([...items, currentItem].join(", "));
    }
  };

  return (
    <div className="flex w-full items-center space-x-2 flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 w-full">
        <div className=" col-span-2 flex flex-col gap-2 w-full">
          <Input
            {...controlProps}
            type="text"
            placeholder="Insira os Ingredientes"
            className="rounded-xl h-12"
            // value={currentItem}
            onChange={(e) => {
              setCurrentItem(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddItem();
              }
            }}
            onBlur={handleBlur}
          />
        </div>

        <div className="col-span-1 w-full flex items-end">
          <Button 
            className="rounded-xl bg-button text-foreground hover:text-background font-semibold text-base w-full h-12"
            onClick={handleAddItem}
          >
            <FaPlus /> Add Item
          </Button>
        </div>


      </div>
      
      <div className="flex flex-wrap gap-2 w-full overflow-auto">
        {items.map((item, index) => (
          <BadgeItems
            key={index}
            item={item}
            index={index}
            handleDelete={(index: number) => {
              const newItems = items.filter((_, i) => i !== index);
              setItems(newItems);
              onChange && onChange(newItems.join(", "));
            }}
          />
        ))}
      </div>

    </div>
  );
}