"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OutputGetRestaurantById } from "@/models/dtos/OutputGetRestaurantById";
import { handleGetRestaurantById } from "@/services/restaurant/restaurantBusiness";
import AppSidebar from "@/components/DashboardContent/AppSidebar";
import DashboardLoading from "@/components/DashboardContent/DashboardLoading";

export default function DashboardPage() {
  const { slug } = useParams();
  const [userMetadata, setUserMetadata] = useState<OutputGetRestaurantById | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await handleGetRestaurantById(slug as string);
      setUserMetadata(data);
    };

    fetchData().then(() => {});
  }, [slug]);

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

      <main className="flex gap-6 flex-1 min-h-[100%] min-w-[80%] px-8 my-6 flex-col ">
        <div className="flex flex-col flex-initial gap-2 border-2 rounded-2xl p-4 w-[100%]">
          <h2 className="text-3xl text-foreground">Olá {userMetadata.name}</h2>
          <p className="text-lg text-muted-foreground/80">Seja bem-vindo ao seu dashboard</p>
        </div>

        {/* TODO: Implementar um componente para vizualizar a receita do dia: A Receber, Recebido, Total */}
        <div className="flex flex-col flex-initial gap-2 w-[80%]">
          <h2 className="text-3xl text-foreground">Revenue</h2>
          <p className="text-lg text-muted-foreground/80">A Receber, Recebido, Total</p>
        </div>
        <SidebarTrigger />
      </main>
    </SidebarProvider>
  );
}