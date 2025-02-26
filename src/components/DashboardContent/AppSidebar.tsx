"use client"

import * as React from "react";
import NavUser from "@/components/sidebarContent/NavUser";
import SquareMenu from "@/assets/square-menu.svg";
import Settings2 from "@/assets/settings-2.svg";
import Bot from "@/assets/bot.svg";
import BookOpen from "@/assets/book-open.svg";
import Frame from "@/assets/frame.svg";
import PieChart from "@/assets/chart-pie.svg";
import MapIcon from "@/assets/map.svg";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "../ui/sidebar";
import NavMain from "../sidebarContent/NavMain";
import NavProjects from "../sidebarContent/NavProjects";

// const user = {
//   name: "shadcn",
//   email: "m@example.com",
//   avatar: "@/avatars/shadcn.jpg",
// };

const projects = [
  {
    name: "Design Engineering",
    url: "#",
    icon: Frame,
  },
  {
    name: "Sales & Marketing",
    url: "#",
    icon: PieChart,
  },
  {
    name: "Travel",
    url: "#",
    icon: MapIcon,
  },
];

interface AppSidebarProps {
    Name: string;
    Email: string;
    Avatar: string;
    Id: string;
    RestaurantId: string;
  // user: {
  //   name: string;
  //   email: string;
  //   avatar: string;
  // };
  // navMainContent: {
  //   title: string;
  //   url: string;
  //   icon: string;
  //   isActive: boolean;
  //   items: {
  //     title: string;
  //     url: string;
  //   }[];
  // }[];
  // projects: {
  //   name: string;
  //   url: string;
  //   icon: string;
  // }[];
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
          url: `/restaurant/menu/edit/${RestaurantId}`,
        },
        {
          title: "Promoções",
          url: "/restaurant/menu/promotions",
        },
        {
          title: "Gerar QR Code",
          url: "/restaurant/menu/qrcode",
        },
      ],
    },
    {
      title: "Pedidos",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Ver Pedidos",
          url: "#",
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
    },
    // {
    //   title: "Documentation",
    //   url: "#",
    //   icon: BookOpen,
    //   items: [
    //     {
    //       title: "Introduction",
    //       url: "#",
    //     },
    //     {
    //       title: "Get Started",
    //       url: "#",
    //     },
    //     {
    //       title: "Tutorials",
    //       url: "#",
    //     },
    //     {
    //       title: "Changelog",
    //       url: "#",
    //     },
    //   ],
    // },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ];

  const user = {
    name: Name,
    email: Email,
    avatar: Avatar,
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-2xl mx-2 my-3">
            Cheffia
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain item={navMainContent} />
            {/* Verificar se este componente vai ser necessário em algum momento */}
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
