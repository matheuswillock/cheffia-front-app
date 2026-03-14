"use client"

import * as React from "react";
import NavUser from "@/components/sidebarContent/NavUser";
import SquareMenu from "@/assets/square-menu.svg";
import ClipBoardPenLine from "@/assets/clipboard-pen-line.svg";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarTrigger } from "../ui/sidebar";
import NavMain from "../sidebarContent/NavMain";

interface AppSidebarProps {
    Name: string;
    Email: string;
    Avatar: string;
    Id: string;
    RestaurantId: string;
}

// TODO: Criar um interface para popular as informações do usuário;
export default function AppSidebar({
  Name,
  Email,
  Avatar,
  Id,
  RestaurantId, 
} : AppSidebarProps) {

  const navMainContent = [
    {
      title: "Menu",
      url: "#",
      icon: SquareMenu,
      isActive: true,
      items: [
        {
          title: "Editar",
          url: `/restaurant/menu/${RestaurantId}/edit/`,
        },
        {
          title: "Promoções",
          url: `/restaurant/menu/${RestaurantId}/promotions`,
        },
        {
          title: "Gerar QR Code",
          url: `/restaurant/menu/${RestaurantId}/qrcode`,
        },
      ],
    },
    {
      title: "Pedidos",
      url: "#",
      icon: ClipBoardPenLine,
      items: [
        {
          title: "Central de Pedidos",
          url: `/restaurant/order-hub/${RestaurantId}`,
        },
        {
          title: "Histórico",
          url: "#",
        },
        {
          title: "Configurações",
          url: "#",
        },
      ],
    }
  ];

  const user = {
    name: Name,
    email: Email,
    avatar: Avatar,
  }

  return (
    <Sidebar className="py-4">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-2xl mb-2">
            Cheffia
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <NavMain item={navMainContent} />
            {/* TODO: Verificar se este componente vai ser necessário em algum momento */}
            {/* <NavProjects projects={projects} /> */}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
