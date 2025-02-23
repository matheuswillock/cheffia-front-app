
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { checkUserSession } from "@/utils/utils";
import { useParams } from 'next/navigation'
import { useEffect, useState } from "react";

export default async function DashboardPage() {
  const { id } = useParams();
  const [userMetadata, setUserMetadata] = useState(null);  

  // TODO: Add o request restaurant data

  useEffect(() => {
    async function fetchUserSession() {
      const { user_metadata } = await checkUserSession();
    }

    fetchUserSession();
  }, []);

  if (!userMetadata) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
      </main>
    </SidebarProvider>
  );
}

