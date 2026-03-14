import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BackofficeDashboardService,
  type BackofficeMetricsPeriod,
} from "@/app/api/useCases/backoffice";

interface DashboardPageProps {
  searchParams?: Promise<{ period?: string }>;
}

const resolvePeriod = (value?: string): BackofficeMetricsPeriod => {
  if (value === "30d" || value === "6m") return value;
  return "7d";
};

const periodLabels: Record<BackofficeMetricsPeriod, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "6m": "6 meses",
};

export default async function BackofficeDashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const period = resolvePeriod(params.period);
  const service = new BackofficeDashboardService();
  const metricsOutput = await service.getMetrics(period);
  const metrics = metricsOutput.result;

  if (!metrics) {
    return <div className="text-sm text-red-400">Nao foi possivel carregar a dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard de monitoria</h2>
          <p className="text-sm text-slate-400">
            Visao consolidada do ecossistema Cheffia por periodo.
          </p>
        </div>

        <div className="flex gap-2">
          {(["7d", "30d", "6m"] as BackofficeMetricsPeriod[]).map((option) => (
            <Link
              key={option}
              href={`/backoffice/dashboard?period=${option}`}
              className={`rounded-xl px-3 py-2 text-sm ${
                option === period
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-800"
              }`}
            >
              {periodLabels[option]}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>Novos clientes</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-semibold">{metrics.newClients}</CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>Clientes que sairam</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-semibold">{metrics.clientsExited}</CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>Pedidos totais</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-semibold">{metrics.totalOrders}</CardContent>
        </Card>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>Pedidos por restaurante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.ordersByRestaurant.length ? (
            metrics.ordersByRestaurant.map((entry) => (
              <div
                key={entry.restaurantId}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
              >
                <span>{entry.restaurantName}</span>
                <span className="font-medium">{entry.totalOrders} pedidos</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">Nenhum pedido encontrado no periodo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
