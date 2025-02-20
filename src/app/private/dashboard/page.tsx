import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { checkUserSession } from "@/utils/utils";

export default async function DashboardPage({ children }: { children: React.ReactNode }) {
  await checkUserSession();

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <main>
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </>
  );
}