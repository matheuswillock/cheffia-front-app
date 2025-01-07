
import Calendar from "@/assets/calendar.svg";
import Inbox from "@/assets/inbox.svg";
import Search from "@/assets/search.svg";
import Settings from "@/assets/settings.svg";
import house from "@/assets/house.svg";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";

// Menu items.
const items = [
  {
    title: "house",
    url: "#",
    icon: house,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export default function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="flex flex-col gap-6 pt-group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-5xl">
            Application
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="text-3xl h-14">
                    <Link href={item.url}>
                      {/* <item.icon width={100} height={100} className="" /> */}
                      <Image
                        src={item.icon}
                        alt={""}
                        width={26}
                        height={26}
                        color="hsl(var(--foreground))"
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}