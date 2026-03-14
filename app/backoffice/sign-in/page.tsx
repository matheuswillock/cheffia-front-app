import {
  backofficeSignIn,
  bootstrapBackofficeAdmin,
} from "@/app/actions/backoffice-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InternalUsersService } from "@/app/api/useCases/backoffice";

const BOOTSTRAP_ADMIN_EMAIL = "matheuswillock@cheffia-tech.com";
const BOOTSTRAP_ADMIN_FULL_NAME = "Matheus Willock";

interface BackofficeSignInPageProps {
  searchParams?: Promise<{ error?: string }>;
}

export default async function BackofficeSignInPage({
  searchParams,
}: BackofficeSignInPageProps) {
  const params = (await searchParams) ?? {};
  const error = params.error ? decodeURIComponent(params.error) : "";
  const service = new InternalUsersService();
  const hasUsers = (await service.countUsers()) > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cheffia Backoffice</p>
          <CardTitle className="text-2xl">Acesso interno</CardTitle>
          <p className="text-sm text-slate-400">
            Use sua conta corporativa `@cheffia-tech.com`.
          </p>
        </CardHeader>
        <CardContent>
          <form action={backofficeSignIn} className="space-y-4">
            <Input
              name="email"
              type="email"
              placeholder="nome@cheffia-tech.com"
              required
              className="bg-slate-950"
            />
            <Input
              name="password"
              type="password"
              placeholder="Senha"
              required
              className="bg-slate-950"
            />
            <Button type="submit" className="w-full">
              Entrar no backoffice
            </Button>
          </form>

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

          {!hasUsers ? (
            <div className="mt-6 rounded-xl border border-amber-700/40 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-200">Bootstrap inicial do backoffice</p>
              <p className="mt-1 text-sm text-amber-100/80">
                Nenhum usuario interno existe ainda. Cadastre o acesso inicial exclusivo do CEO.
              </p>
              <form action={bootstrapBackofficeAdmin} className="mt-4 space-y-3">
                <Input
                  value={BOOTSTRAP_ADMIN_FULL_NAME}
                  readOnly
                  className="bg-slate-950"
                />
                <Input
                  value={BOOTSTRAP_ADMIN_EMAIL}
                  readOnly
                  className="bg-slate-950"
                />
                <Input
                  name="password"
                  type="password"
                  placeholder="Defina a senha inicial do CEO"
                  required
                  className="bg-slate-950"
                />
                <Button type="submit" variant="outline" className="w-full border-amber-600">
                  Criar admin inicial
                </Button>
              </form>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
