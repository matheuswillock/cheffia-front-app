import { StaticImageData } from "next/image";
import ImageOff from "@/assets/image-off.svg";
import Image from 'next/image';
import { JSX, useState } from "react";
import { MenuItem } from "@/models/menuModels/MenuItem";
import ErrorIcon from "../../../../public/assets/Icons/error-Icon.svg";
import LoadingSpin from "@/assets/loading-spin.svg";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ButtonGroup from "./ButtonGroup";

interface MenuListToEditProps {
  items: MenuItem[];
  handleDeleteButton: (menuItemId: string) => void;
  loadingButtonDeleteItem: boolean;
  loadingButtonEditItem: boolean;
}

export default function MenuListToEdit({items = [], handleDeleteButton, loadingButtonDeleteItem, loadingButtonEditItem} : MenuListToEditProps) {
  const [openDeleteAlertModal, setOpenDeleteAlertModal] = useState(false);
  const [openEditAlertModal, setOpenEditAlertModal] = useState(false);

  return (
    <>
      {items.length <= 0 ? (
        <div className="flex flex-col gap-12 items-center justify-center pt-4 md:pt-8 lg:pt-16 xl:pt-16 w-full">
          <h3 className="text-2xl xl:text-3xl font-inter font-medium text-center">
            O seu menu está vazio.
          </h3>

          <Image
            src={ErrorIcon}
            width={42.95}
            height={43.9}
            alt={""}
            className="w-32"
          />
        </div>
      ) : (
        <>
          {items.map((item) => (
            <div key={item.id}>
              <div
                key={item.id}
                className="flex flex-row items-center w-full gap-3 md:gap-6 my-4 px-2 md:px-6 lg:px-8 xl:px-10 py-4"
              >
                <Image
                  src={item.mediaImgixUrl || (ImageOff as StaticImageData)}
                  alt={""}
                  width={128}
                  height={160}
                  className="w-16 h-16 sm:w-28 sm:h-28 md:w-24 md:h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 rounded-xl flex-shrink-0 object-cover "
                />

                <div className="flex flex-col sm:grid grid-cols-4 w-full gap-2">
                  <div className="flex flex-col gap-[10px] md:grid grid-row-3 h-full col-span-2">
                    <p className="text-base md:text-lg lg:text-2xl xl:text-2xl font-inter font-semibold md:font-medium flex items-center justify-start">
                      {item.name}
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {item.ingredients
                        ?.map((item, index) => (
                          <p
                            key={index}
                            className="text-xs md:text-sm  font-inter flex items-center font-semibold bg-background-green/80 text-foreground-black rounded-full px-2 py-[2px] w-fit"
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
                          <div
                            key={rowIndex}
                            className="flex gap-[3px] sm:gap-1 md:gap-2"
                          >
                            {row}
                          </div>
                        ))}
                    </div>

                    <p className="text-sm sm:text-base md:text-lg xl:text-xl text-foreground-card font-inter font-medium self-start">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 col-span-2 sm:items-end">
                    <p className="text-xl lg:text-2xl text-foreground-white font-semibold sm:mr-2 sm:text-center">
                      R$ {item.price}
                    </p>
                    <ButtonGroup
                      menuItemId={item.id}
                      handleDeleteButton={handleDeleteButton}
                    />
                  </div>
                </div>
              </div>

              {items[items.length - 1].id !== item.id && (
                <Separator className=" bg-muted w-full" />
              )}
            </div>
          ))}
        </>
      )}
    </>
  );
}