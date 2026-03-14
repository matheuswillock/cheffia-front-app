import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackofficeRestaurantsService } from "@/app/api/useCases/backoffice";

interface RestaurantsPageProps {
  searchParams?: Promise<{ q?: string; status?: string }>;
}

export default async function BackofficeRestaurantsPage({
  searchParams,
}: RestaurantsPageProps) {
  const params = (await searchParams) ?? {};
  const search = params.q ?? "";
  const status = params.status ?? "all";
  const service = new BackofficeRestaurantsService();
  const output = await service.list(search, status);
  const restaurants = output.result ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Restaurantes</h2>
        <p className="text-sm text-slate-400">
          Busca global de restaurantes, assinatura e acessos.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[2fr_1fr_160px]">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Buscar por nome, email ou responsavel"
              className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="cancelled">Cancelados</option>
            </select>
            <button className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950">
              Filtrar
            </button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {restaurants.map((restaurant) => (
          <Link
            key={restaurant.id}
            href={`/backoffice/restaurants/${restaurant.id}`}
            className="block rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900/80"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                <p className="text-sm text-slate-400">
                  {restaurant.tenantName} · {restaurant.ownerFullName || "Sem responsavel"}
                </p>
                <p className="text-sm text-slate-500">
                  {restaurant.email || "Sem email"} · {restaurant.phoneNumber || "Sem telefone"}
                </p>
              </div>

              <div className="text-sm text-slate-300">
                <p>Status: {restaurant.lifecycleStatus}</p>
                <p>Pedidos: {restaurant.totalOrders}</p>
                <p>Financeiro: {restaurant.financialStatus ?? "N/D"}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
