import { useEffect, useState } from "react";
import Image from "next/image";
import ImageOff from "@/assets/image-off.svg";
import { StaticImageData } from "next/image";
import { GroupedMenuItemsByCategoryOutput } from "@/models/dtos/output/MenuLive/GroupedMenuItemsByCategoryOutput";
import { MenuLiveItemOutput } from "@/models/dtos/output/MenuLive/MenuLiveItemOutput";
import LoaderCircle from "../../../../public/assets/Icons/loader-circle.svg";

interface MenuLiveProps {
  menu: GroupedMenuItemsByCategoryOutput[] | undefined;
  setSelectedItem: (item: MenuLiveItemOutput) => void;
  loading: boolean;
}

export default function MenuLive({ setSelectedItem, menu, loading }: MenuLiveProps) {
  useEffect(() => {
    console.log("MenuLive", menu);
    console.log("setSelectedItem", setSelectedItem);
  }, [menu]);

  return (
    <main className="w-screen overflow-hidden pb-20 sm:pb-24">
      { loading ? (
        <div className="flex items-center justify-center h-[calc(100vh-20rem)]">
          <Image
            src={LoaderCircle}
            alt="Carregando..."
            width={64}
            height={64}
            className="animate-spin"
          />
        </div>
      ) : menu?.length === 0 ? (
        <p className="text-gray-400 text-lg flex items-center justify-center h-[calc(100vh-20rem)]">
          Nenhum item no menu.
        </p>
      ) : (
        menu?.map((item) => (
          <div key={item.id} className="flex flex-col ">
            <div
              className={`${
                item.name &&
                "border-b pb-2 pt-3 w-full flex items-center justify-between my-3"
              }`}
            >
              {item.name && <p className="px-3 text-2xl">{item.name}</p>}
            </div>
            <ul className="space-y-4">
              {item.menuItems?.map((menuItem) => (
                <li
                  key={menuItem.id}
                  className="border-b pb-3 flex flex-row pl-4 pr-1 items-center cursor-pointer active:bg-background-card"
                  onClick={() => setSelectedItem(menuItem)}
                >
                  <div className="text-sm font-inter font-normal flex-1">
                    <p className="font-medium text-base">{menuItem.name}</p>
                    <p className="text-gray-500">
                      {menuItem.description.length > 56
                        ? `${menuItem.description.slice(0, 56)}...`
                        : menuItem.description}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-green-600 font-bold">
                        R$ {menuItem.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <Image
                    src={menuItem.mediaUrl || (ImageOff as StaticImageData)}
                    alt={menuItem.name}
                    width={128}
                    height={160}
                    className="w-16 h-16 sm:w-28 sm:h-28 md:w-24 md:h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 rounded-md flex-shrink-0 object-cover "
                  />
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </main>
  );
}
