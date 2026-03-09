import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackofficeMenuManager } from "@/components/backoffice/BackofficeMenuManager";
import { BackofficeRestaurantEditor } from "@/components/backoffice/BackofficeRestaurantEditor";
import { BackofficeRestaurantsService } from "@/server/application/backoffice";

interface RestaurantDetailPageProps {
  params: Promise<{ restaurantId: string }>;
}

export default async function BackofficeRestaurantDetailPage({
  params,
}: RestaurantDetailPageProps) {
  const { restaurantId } = await params;
  const service = new BackofficeRestaurantsService();
  const detailOutput = await service.getDetail(restaurantId);

  if (!detailOutput.result) {
    notFound();
  }

  const menuOutput = await service.getMenu(restaurantId);
  const restaurant = detailOutput.result;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{restaurant.name}</h2>
        <p className="text-sm text-slate-400">
          Tenant {restaurant.tenantName} · Status {restaurant.lifecycleStatus}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{restaurant.totalOrders}</CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">
            {restaurant.financialStatus ?? "Sem conta provisionada"}
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>E-mail verificado</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">
            {restaurant.emailVerified ? "Sim" : "Nao"}
          </CardContent>
        </Card>
      </div>

      <BackofficeRestaurantEditor restaurant={restaurant} />
      <BackofficeMenuManager restaurantId={restaurant.id} menu={menuOutput.result ?? null} />
    </div>
  );
}
