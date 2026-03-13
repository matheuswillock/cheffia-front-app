"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RestaurantSidebar } from "@/components/restaurant-shell/restaurant-sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface RestaurantShellProps {
  children: React.ReactNode;
  restaurantId: string;
  user: {
    name: string;
    email: string;
    avatar: string;
    supabaseId: string;
  };
}

const resolveTitle = (pathname: string): string => {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.includes("/restaurant/menu/") && pathname.endsWith("/edit")) return "Editar Cardápio";
  if (pathname.includes("/restaurant/menu/") && pathname.endsWith("/qrcode")) return "QR Codes";
  if (pathname.includes("/restaurant/order-hub/")) return "Central de Pedidos";
  if (pathname.startsWith("/restaurant/account")) return "Conta do Restaurante";
  if (pathname.includes("/restaurant/menu/")) return "Menu";
  return "Portal do Restaurante";
};

export function RestaurantShell({ children, restaurantId, user }: RestaurantShellProps) {
  const pathname = usePathname();
  const title = useMemo(() => resolveTitle(pathname), [pathname]);

  return (
    <SidebarProvider>
      <RestaurantSidebar restaurantId={restaurantId} user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          <SidebarTrigger className="-ml-1 h-7 w-7" aria-label="Alternar sidebar" title="Alternar sidebar" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/dashboard/${user.supabaseId}`}>Portal Restaurante</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
