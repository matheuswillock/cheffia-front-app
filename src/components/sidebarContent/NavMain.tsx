"use client";

import { ChevronRight } from "lucide-react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "../ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import Link from "next/link";
import Image from "next/image";

interface NavMainProps {
  item: {
    title: string;
    url: string;
    icon: string;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}

export default function NavMain({ item }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {item.map((item, index) => (
          <Collapsible 
            key={index} 
            asChild 
            defaultOpen={item.isActive}
          >
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip={item.title}
                className="rounded-xl mb-2 bg-transparent hover:bg-primary-foreground hover:bg-opacity-10"
              >
                <Link href={item.url}>
                  <Image src={item.icon} alt={""} />
                  <span className="text-lg ">{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90 rounded-xl hover:bg-primary-foreground hover:bg-opacity-10">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title} >
                          <SidebarMenuSubButton asChild className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl">
                            <Link href={subItem.url}>
                              <span className="rounded-xl ">{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
