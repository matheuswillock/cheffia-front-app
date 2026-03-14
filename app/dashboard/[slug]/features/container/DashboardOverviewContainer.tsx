"use client";

import {
  AlertTriangle,
  CalendarClock,
  DollarSignIcon,
  QrCode,
  RefreshCcw,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLoading from "@/components/DashboardContent/DashboardLoading";
import { useDashboardFeature } from "@/app/dashboard/[slug]/features/context/DashboardFeatureContext";

const formatCurrency = (value: number, currency: string): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);

const formatDateTime = (value: string | null): string => {
  if (!value) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export function DashboardOverviewContainer() {
  const { isLoading, errorMessage, restaurant, financialSummary, reload } = useDashboardFeature();

  if (isLoading || !restaurant || !financialSummary) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-4 lg:px-6 lg:py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="block text-xl font-bold tracking-tight text-foreground-default md:text-2xl">
            Olá, {restaurant.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumo operacional do Asaas, conciliação e repasses do restaurante.
          </p>
        </div>
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
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="overflow-hidden rounded-xl border-none bg-card shadow-md">
            <CardHeader className="bg-primary/10 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <QrCode className="h-4 w-4" />
                Pix pendente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <span className="text-2xl font-bold">
                {formatCurrency(financialSummary.pendingPixAmount, financialSummary.currency)}
              </span>
              <p className="mt-2 text-xs text-muted-foreground">
                Cobranças aguardando confirmação ou processamento.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border-none bg-card shadow-md">
            <CardHeader className="bg-secondary/10 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <DollarSignIcon className="h-4 w-4" />
                Recebido líquido
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <span className="text-2xl font-bold">
                {formatCurrency(financialSummary.receivedAmount, financialSummary.currency)}
              </span>
              <p className="mt-2 text-xs text-muted-foreground">
                Total líquido reconhecido nos pagamentos pagos.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border-none bg-card shadow-md">
            <CardHeader className="bg-muted/30 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4" />
                Disponível para repasse
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <span className="text-2xl font-bold">
                {formatCurrency(financialSummary.availableAmount, financialSummary.currency)}
              </span>
              <p className="mt-2 text-xs text-muted-foreground">
                Valores já disponíveis segundo o calendário financeiro atual.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border-none bg-card shadow-md">
            <CardHeader className="bg-accent/15 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <CalendarClock className="h-4 w-4" />
                Repasse agendado
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <span className="text-2xl font-bold">
                {formatCurrency(financialSummary.scheduledPayoutAmount, financialSummary.currency)}
              </span>
              <p className="mt-2 text-xs text-muted-foreground">
                Próximo repasse: {formatDateTime(financialSummary.nextPayoutAt)}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="rounded-xl border-none bg-card shadow-md">
            <CardHeader>
              <CardTitle>Operação financeira</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background-default/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Onboarding</p>
                <p className="mt-2 font-semibold">{financialSummary.onboardingStatus}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background-default/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Documentos pendentes</p>
                <p className="mt-2 font-semibold">{financialSummary.pendingDocumentsCount}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background-default/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Documentos rejeitados</p>
                <p className="mt-2 font-semibold">{financialSummary.rejectedDocumentsCount}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background-default/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Última cobrança paga</p>
                <p className="mt-2 font-semibold">{formatDateTime(financialSummary.lastPaymentAt)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background-default/40 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Última sincronização Asaas</p>
                <p className="mt-2 font-semibold">{formatDateTime(financialSummary.lastStatusSyncAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-none bg-card shadow-md">
            <CardHeader>
              <CardTitle>Conciliação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border border-border/60 bg-background-default/40 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldAlert className="h-4 w-4" />
                  Divergências abertas
                </div>
                <p className="mt-3 text-3xl font-semibold">{financialSummary.reconciliationMismatchCount}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background-default/40 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  Última execução
                </div>
                <p className="mt-3 font-semibold">{formatDateTime(financialSummary.lastReconciliationAt)}</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
