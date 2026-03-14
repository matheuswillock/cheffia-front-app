"use client";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { createClient } from "@/utils/supabase/client";

interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

export default function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const handleAvatarFallback = () => {
    const nameParts = user.name.split(" ");
    const initials = nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
      : `${nameParts[0][0]}`;
    return initials.toUpperCase();
  }

  const handleLogout = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    router.replace("/sign-in");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem >
        <DropdownMenu >
          <DropdownMenuTrigger asChild className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl">
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-primary-foreground data-[state=open]:text-sidebar-accent-foreground h-16 rounded-xl mb-2 h"
            >
              <Avatar className="h-12 w-12 rounded-xl">
                <AvatarImage
                  src={user.avatar}
                  alt={user.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "";
                  }}
                />
                <AvatarFallback className="rounded-lg">{handleAvatarFallback()}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-background-default shadow-lg border-border-default/20"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-xl">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{handleAvatarFallback()}</AvatarFallback>
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
            {/* TODO: Add o evento de logout */}
            <DropdownMenuItem className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl"
              onClick={() => {
                void handleLogout();
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
