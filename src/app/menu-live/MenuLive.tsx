import { useEffect, useState } from "react";
import { HandleGetMenuLive } from "@/business/menuLive/menuLiveBusiness";
import { MenuItem } from "@/models/menuModels/MenuItem";
import Image from "next/image";
import ImageOff from "@/assets/image-off.svg";
import { StaticImageData } from "next/image";
import { GroupedMenuItemsByCategoryOutput } from "@/models/dtos/output/MenuLive/GroupedMenuItemsByCategoryOutput";
import { MenuLiveItemOutput } from "@/models/dtos/output/MenuLive/MenuLiveItemOutput";

interface MenuLiveProps {
  menu: GroupedMenuItemsByCategoryOutput[] | undefined;
  setSelectedItem: (item: MenuLiveItemOutput) => void;
}

export default function MenuLive({ setSelectedItem, menu }: MenuLiveProps) {

  useEffect(() => {
    console.log("MenuLive", menu);
    console.log("setSelectedItem", setSelectedItem);
  }, [menu]);

  return (
    <main className="w-screen overflow-hidden mt-4 pb-20 sm:pb-24">
      {menu?.length === 0 ? (
        <p className="text-gray-600 text-lg flex items-center justify-center h-[calc(100vh-20rem)]">
          Nenhum item no menu ainda.
        </p>
      ) : (
        menu?.map((item) => (
          <div key={item.id} className="flex flex-col items-start">
            {item.name && (
              <div className="w-full flex items-center justify-between border-b mb-3">
                <p className="px-3 py-2">{item.name}</p>
              </div>
            )}
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
                    src={ImageOff as StaticImageData}
                    alt={menuItem.name}
                    width={128}
                    height={160}
                    className="w-20 h-20 sm:w-28 sm:h-28 md:w-24 md:h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 rounded-xl object-cover"
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
