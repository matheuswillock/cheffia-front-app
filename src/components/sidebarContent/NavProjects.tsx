import Link from "next/link";
import Image from "next/image";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import MoreHorizontal from "@/assets/move-horizontal.svg";
import Folder from "@/assets/folder.svg";
import Forward from "@/assets/forward.svg";
import Trash2 from "@/assets/trash-2.svg";

interface NavProjectsProps {
  projects: {
    name: string
    url: string
    icon: string
  }[]
}

export default function NavProjects({projects}: NavProjectsProps) {
  const { isMobile } = useSidebar();
  
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton asChild className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl">
              <Link href={item.url}>
                <Image src={item.icon} alt={`icone do item ${item.icon}`} />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <Image src={MoreHorizontal} alt={""} />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-xl"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Image
                    src={Folder}
                    alt={""}
                    className="text-muted-foreground"
                  />
                  <span>View project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Image
                    src={Forward}
                    alt={""}
                    className="text-muted-foreground"
                  />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Image
                    src={Trash2}
                    alt={""}
                    className="text-muted-foreground"
                  />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="hover:bg-primary-foreground hover:bg-opacity-10 rounded-xl">
            <Image src={MoreHorizontal} alt={""}/>
            <span>More projects</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );

}