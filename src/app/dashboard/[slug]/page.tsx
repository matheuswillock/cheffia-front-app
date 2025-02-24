"use client";

import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OutputGetRestaurantById } from "@/models/dtos/OutputGetRestaurantById";
import { handleGetRestaurantById } from "@/services/restaurant/restaurantBusiness";
import { checkUserSession } from "@/utils/supabase/client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { slug } = useParams();
  const [userMetadata, setUserMetadata] = useState<OutputGetRestaurantById | null>(null);

  useEffect(() => {
    async function fetchData() {
      await checkUserSession();
      const data = await handleGetRestaurantById(slug as string);
      console.log(data);
      setUserMetadata(data);
    }

    fetchData();
  }, [slug]);

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