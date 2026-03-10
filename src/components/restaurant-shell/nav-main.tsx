"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavigationChildItem {
  title: string;
  url: string;
}

interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: NavigationChildItem[];
}

interface RestaurantNavMainProps {
  items: NavigationItem[];
}

const isActivePath = (pathname: string, href: string): boolean => {
  if (!href || href === "#") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
};

export function RestaurantNavMain({ items }: RestaurantNavMainProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Restaurante</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = Boolean(item.items?.length);
          const childActive = item.items?.some((child) => isActivePath(pathname, child.url)) ?? false;
          const itemActive = childActive || isActivePath(pathname, item.url);

          return (
            <Collapsible key={item.title} asChild defaultOpen={itemActive}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={itemActive} tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>

                {hasChildren ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Expandir</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((child) => {
                          const childIsActive = isActivePath(pathname, child.url);
                          return (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton asChild isActive={childIsActive}>
                                <Link href={child.url}>
                                  <span>{child.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
