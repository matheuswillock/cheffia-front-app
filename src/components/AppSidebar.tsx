"use client"
import * as React from "react";
import NavUser from "@/components/sidebarContent/NavUser";
import SquareMenu from "@/assets/square-menu.svg";
//import SquareTerminal from "@/assets/square-terminal.svg";
import Settings2 from "@/assets/settings-2.svg";
import Bot from "@/assets/bot.svg";
import BookOpen from "@/assets/book-open.svg";
import NavMain from "./sidebarContent/NavMain";
import NavProjects from "./sidebarContent/NavProjects";
import Frame from "@/assets/frame.svg";
import PieChart from "@/assets/chart-pie.svg";
import MapIcon from "@/assets/map.svg";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel
} from "./ui/sidebar";

const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "@/avatars/shadcn.jpg",
};

const navMainContent = [
  {
    title: "Menu",
    url: "#",
    icon: SquareMenu,
    isActive: true,
    items: [
      {
        title: "Editar",
        url: "restaurant/menu/edit",
      },
      {
        title: "promoções",
        url: "#",
      },
      {
        title: "Settings",
        url: "#",
      },
    ],
  },
  {
    title: "Models",
    url: "#",
    icon: Bot,
    items: [
      {
        title: "Genesis",
        url: "#",
      },
      {
        title: "Explorer",
        url: "#",
      },
      {
        title: "Quantum",
        url: "#",
      },
    ],
  },
  {
    title: "Documentation",
    url: "#",
    icon: BookOpen,
    items: [
      {
        title: "Introduction",
        url: "#",
      },
      {
        title: "Get Started",
        url: "#",
      },
      {
        title: "Tutorials",
        url: "#",
      },
      {
        title: "Changelog",
        url: "#",
      },
    ],
  },
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

export default function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-2xl mx-2 my-3">
            Cheffia
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain item={navMainContent} />
            <NavProjects projects={projects} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
