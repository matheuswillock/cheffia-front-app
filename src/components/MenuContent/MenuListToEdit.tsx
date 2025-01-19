import { StaticImageData } from "next/image";
import Burguer from "@/avatars/burguer.jpg";
import Image from 'next/image';
import { JSX } from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

interface MenuItem {
  name: string;
  price: string;
  icon: StaticImageData;
  items: string[];
}

interface MenuListToEditProps {
  items: MenuItem[];
}

export default function MenuListToEdit({items} : MenuListToEditProps) {
  return(
    <div className="p-4  border-border border-4 rounded-xl">
      {items.map((item, index) => (
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
                    )
                  )}
                </div>

                <p className="text-xl font-semibold self-end">
                  R$ {item.price}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 self-end items-end">
              <Button className="rounded-xl w-24 bg-red-600/50 hover:bg-red-600 text-foreground font-semibold text-base">
                Deletar
              </Button>
              <Button className="rounded-xl w-24 font-semibold text-base bg-button text-foreground hover:bg-button-solid hover:text-background">
                Editar
              </Button>
            </div>
          </div>

          <Separator className="my-4 bg-muted" />
        </div>
      ))}
    </div>
  );
}