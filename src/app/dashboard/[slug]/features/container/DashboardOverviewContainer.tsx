"use client";

import { ArrowDownIcon, ArrowUpIcon, DollarSignIcon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLoading from "@/components/DashboardContent/DashboardLoading";
import { useDashboardFeature } from "@/app/dashboard/[slug]/features/context/DashboardFeatureContext";

export function DashboardOverviewContainer() {
  const { isLoading, errorMessage, restaurant, reload } = useDashboardFeature();

  if (isLoading || !restaurant) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-4 lg:px-6 lg:py-8">
      <header className="flex items-center justify-between gap-4">
        <h2 className="block text-xl font-bold tracking-tight text-foreground-default md:text-2xl">
          Olá, {restaurant.name}
        </h2>
        <Button variant="outline" onClick={() => void reload()}>
          <RefreshCcw />
          Atualizar
        </Button>
      </header>

      {errorMessage ? (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-hidden rounded-xl border-none bg-card shadow-md transition-all hover:shadow-lg">
              <CardHeader className="bg-primary/10 pb-2">
                <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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

            <Card className="overflow-hidden rounded-xl border-none bg-card shadow-md transition-all hover:shadow-lg">
              <CardHeader className="bg-secondary/10 pb-2">
                <CardTitle className="text-sm font-medium">Recebido</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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

            <Card className="overflow-hidden rounded-xl border-none bg-card shadow-md transition-all hover:shadow-lg">
              <CardHeader className="bg-muted/30 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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

        <section className="space-y-4">
          <h3 className="px-2 text-2xl font-semibold tracking-tight">Atividade Recente</h3>
          <Card className="rounded-xl border-none bg-card shadow-md">
            <CardContent className="p-6">
              <div className="rounded-lg bg-muted/30 p-8 text-center">
                <p className="text-muted-foreground">Dados de atividade recente serão exibidos aqui.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
