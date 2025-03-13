"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import type { OutputGetRestaurantById } from "@/models/dtos/OutputGetRestaurantById"
import { handleGetRestaurantById } from "@/services/restaurant/restaurantBusiness"
import AppSidebar from "@/components/DashboardContent/AppSidebar"
import DashboardLoading from "@/components/DashboardContent/DashboardLoading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export default function DashboardPage() {
  const { slug } = useParams()
  const [userMetadata, setUserMetadata] = useState<OutputGetRestaurantById | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const data = await handleGetRestaurantById(slug as string)
      setUserMetadata(data)
    }

    fetchData().then(() => {})
  }, [slug])

  if (!userMetadata) {
    return <DashboardLoading />
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

      <SidebarInset className="flex-1 flex flex-col gap-8 overflow-y-auto p-4 md:p-4 lg:px-6 lg:py-8 ">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 ">
            <SidebarTrigger className="-ml-1 my-0" />
            <Separator orientation="vertical" className="mr-2 h-6" />
            <h3 className="block text-xl font-bold tracking-tight text-foreground md:text-2xl">
              Olá, {userMetadata.name}
            </h3>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 lg:min-w-[940px]">
          {/* Revenue Overview */}
          {/* TODO: implementar a inteligencia da API para alimentar as infos */}
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="overflow-hidden bg-card border-none shadow-md transition-all hover:shadow-lg rounded-xl">
                <CardHeader className="bg-primary/10 pb-2">
                  <CardTitle className="text-sm font-medium">A Receber</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSignIcon className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold">R$ 2.350,00</span>
                    </div>
                    <div className="flex items-center text-sm text-green-500">
                      <ArrowUpIcon className="mr-1 h-4 w-4" />
                      <span>12%</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Comparado ao mês anterior</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden bg-card border-none shadow-md transition-all hover:shadow-lg rounded-xl">
                <CardHeader className="bg-secondary/10 pb-2">
                  <CardTitle className="text-sm font-medium">Recebido</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSignIcon className="h-5 w-5 text-secondary" />
                      <span className="text-2xl font-bold">R$ 5.120,00</span>
                    </div>
                    <div className="flex items-center text-sm text-green-500">
                      <ArrowUpIcon className="mr-1 h-4 w-4" />
                      <span>8%</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Comparado ao mês anterior</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden bg-card border-none shadow-md transition-all hover:shadow-lg rounded-xl">
                <CardHeader className="bg-muted/30 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSignIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-2xl font-bold">R$ 7.470,00</span>
                    </div>
                    <div className="flex items-center text-sm text-red-500">
                      <ArrowDownIcon className="mr-1 h-4 w-4" />
                      <span>3%</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Comparado ao mês anterior</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Recent Activity Section */}
          {/* TODO: implementar o item mais pedido da noite */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight px-2">Atividade Recente</h2>
            <Card className="border-none bg-card shadow-md rounded-xl">
              <CardContent className="p-6">
                <div className="rounded-lg bg-muted/30 p-8 text-center">
                  <p className="text-muted-foreground">Dados de atividade recente serão exibidos aqui</p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

      </SidebarInset>
    </SidebarProvider>
  )
}

