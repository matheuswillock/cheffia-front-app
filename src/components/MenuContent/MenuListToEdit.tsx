import { StaticImageData } from "next/image";
import ImageOff from "@/assets/image-off.svg";
import Image from 'next/image';
import { JSX, useState } from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { MenuItem } from "@/models/menuModels/MenuItem";
import LoadingSpin from "@/assets/loading-spin.svg";
import { handleDeleteMenuItem } from "@/business/restaurant/menu/menuBusiness";

interface MenuListToEditProps {
  items: MenuItem[];
  handleDeleteButton: (menuItemId: string) => void;
  loadingButtonDeleteItem: boolean;
  loadingButtonEditItem: boolean;
}

export default function MenuListToEdit({items = [], handleDeleteButton, loadingButtonDeleteItem, loadingButtonEditItem} : MenuListToEditProps) {

  return(
    <div className="p-4  border-border border-4 rounded-xl">

      {items.length <= 0 ?
        (
          <div className="flex items-center justify-center p-4">
            <h3 className="text-2xl font-semibold">
              O seu menu está vazio.
            </h3>
          </div>

        ) : (      
          <>
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center flex-col items-baseline justify-between p-4 gap-4"
              >
                <div
                  className="grid grid-cols-4 w-full"
                >
                  <div className="grid grid-cols-3 col-span-3 ">

                    <div className="w-28 h-32  rounded-xl m-auto">
                      <Image
                        src={item.mediaImgixUrl || ImageOff as StaticImageData}
                        alt={""}
                        width={128}
                        height={160}
                        className="rounded-xl h-full "
                      />
                    </div>

                    <div
                      className="grid grid-row-3 gap-3 h-full col-span-2"
                    >
                      <h3 className="text-2xl font-semibold self-start">
                        {item.name}
                      </h3>

                      <div>
                        <p className="text-base font-medium self-start">
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        {item.ingredients?.map((item, index) => (
                            <p
                              key={index}
                              className="text-sm font-medium text-gray-500"
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
                    <Button 
                      className="rounded-xl w-24 bg-red-600/50 hover:bg-red-600 text-foreground font-semibold text-base"
                      onClick={() => handleDeleteButton(item.id)}
                    >
                      {loadingButtonDeleteItem ? (
                        <Image
                          src={LoadingSpin}
                          alt="Loading"
                          className="animate-spin"
                        />
                      ) : (
                        <>
                          Deletar
                        </>
                      )}                      
                    </Button>

                    <Button className="rounded-xl w-24 font-semibold text-base bg-button text-foreground hover:bg-button-solid hover:text-background">
                      {loadingButtonEditItem ? (
                        <Image
                          src={LoadingSpin}
                          alt="Loading"
                          className="h-12 w-12 animate-spin"
                        />
                      ) : (
                        <>
                          Editar
                        </>
                      )}    
                    </Button>
                  </div>
                </div>

                <Separator className="my-4 bg-muted" />
              </div>
            ))}
          </>
        )      
      }
    </div>
  );
}