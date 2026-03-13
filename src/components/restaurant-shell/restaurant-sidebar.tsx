"use client";

import { ChefHat, ClipboardList, LayoutDashboard, LifeBuoy, MessageCircleQuestion, UtensilsCrossed, WalletCards } from "lucide-react";
import Link from "next/link";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { RestaurantNavMain } from "@/components/restaurant-shell/nav-main";
import { RestaurantNavUser } from "@/components/restaurant-shell/nav-user";

interface RestaurantSidebarProps extends React.ComponentProps<typeof Sidebar> {
  restaurantId: string;
  user: {
    name: string;
    email: string;
    avatar: string;
    supabaseId: string;
  };
}

export function RestaurantSidebar({ restaurantId, user, ...props }: RestaurantSidebarProps) {
  const navigation = [
    {
      title: "Dashboard",
      url: `/dashboard/${user.supabaseId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Menu",
      url: `/restaurant/menu/${restaurantId}/edit`,
      icon: UtensilsCrossed,
      items: [
        {
          title: "Editar cardápio",
          url: `/restaurant/menu/${restaurantId}/edit`,
        },
        {
          title: "Visualizar menu",
          url: `/restaurant/menu/${restaurantId}`,
        },
        {
          title: "QR Code",
          url: `/restaurant/menu/${restaurantId}/qrcode`,
        },
      ],
    },
    {
      title: "Pedidos",
      url: `/restaurant/order-hub/${restaurantId}`,
      icon: ClipboardList,
    },
    {
      title: "Conta",
      url: "/restaurant/account",
      icon: WalletCards,
    },
  ];

  const secondaryNavigation = [
    {
      title: "Suporte",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: MessageCircleQuestion,
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/dashboard/${user.supabaseId}`}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ChefHat />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Cheffia</span>
                  <span className="truncate text-xs">Restaurant Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <RestaurantNavMain items={navigation} />
        <NavSecondary items={secondaryNavigation} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <RestaurantNavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

