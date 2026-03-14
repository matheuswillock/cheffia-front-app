import { BackofficeUserAdminPanel } from "@/components/backoffice/BackofficeUserAdminPanel";
import { requireBackofficePage, InternalUsersService } from "@/app/api/useCases/backoffice";

export default async function BackofficeUsersPage() {
  await requireBackofficePage({ minimumRole: "admin" });
  const service = new InternalUsersService();
  const output = await service.list();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Usuarios internos</h2>
        <p className="text-sm text-slate-400">
          Gestao exclusiva de contas do portal interno Cheffia.
        </p>
      </div>

      <BackofficeUserAdminPanel users={output.result ?? []} />
    </div>
  );
}
