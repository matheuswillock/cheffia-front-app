"use client";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

export default function navUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem >
        <DropdownMenu >
          <DropdownMenuTrigger asChild className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl">
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-primary-foreground data-[state=open]:text-sidebar-accent-foreground h-16 rounded-xl mb-2 h"
            >
              <Avatar className="h-10 w-10 rounded-xl">
                <AvatarImage
                  src={"https://github.com/shadcn.png"}
                  alt={user.name}
                />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-background shadow-lg border-border/20"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl">
              <DropdownMenuItem className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl">
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl">
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl">
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl">
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuItem className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
