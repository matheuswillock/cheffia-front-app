"use client";

import AppSidebar from "@/components/DashboardContent/AppSidebar";
import DashboardLoading from "@/components/DashboardContent/DashboardLoading";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OutputGetRestaurantById } from "@/models/dtos/OutputGetRestaurantById";
import { handleGetRestaurantById, handleRestaurantWebSocket } from "@/services/restaurant/restaurantBusiness";
import { checkUserSession } from "@/utils/supabase/client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { slug } = useParams();
  const [userMetadata, setUserMetadata] = useState<OutputGetRestaurantById | null>(null);

  const { messages, sendMessage } = handleRestaurantWebSocket(slug as string);

  useEffect(() => {
    const fetchData = async () => {
      await checkUserSession();
      const data = await handleGetRestaurantById(slug as string);
      setUserMetadata(data);
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    if (messages.length > 0) {
      console.log("New message received:", messages[messages.length - 1]);
    }
  }, [messages]);

  if (!userMetadata) {
    return <DashboardLoading />;
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        Name={userMetadata.name}
        Email={userMetadata.email}
        Avatar={userMetadata.providerAvatarUrl}
        Id={userMetadata.supabaseId}
        RestaurantId={userMetadata.id}
      />
      <main className="flex justify-between min-h-[100%] mx-1 my-6 flex-col">
        <div className="flex flex-col flex-initial gap-2 w-full ml-4">
          <h2 className="text-3xl text-foreground">Olá {userMetadata.name}</h2>
          <p className="text-lg text-muted-foreground/80">Seja bem-vindo ao seu dashboard</p>
        </div>
        <SidebarTrigger />
      </main>
    </SidebarProvider>
  );
}