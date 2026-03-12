import Link from "next/link";
import { backofficeSignOut } from "@/business/backoffice/auth/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { BackofficeUserOutput } from "@/server/application/backoffice";

interface BackofficeShellProps {
  currentUser: BackofficeUserOutput;
  children: React.ReactNode;
}

const navItems = [
  { href: "/backoffice/dashboard", label: "Dashboard" },
  { href: "/backoffice/restaurants", label: "Restaurantes" },
  { href: "/backoffice/users", label: "Usuarios" },
];

export function BackofficeShell({ currentUser, children }: BackofficeShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cheffia Backoffice</p>
            <h1 className="text-xl font-semibold">Portal interno</h1>
          </div>

          <div className="flex items-center gap-3 text-right">
            <ThemeToggle />

            <div>
              <p className="text-sm font-medium">{currentUser.fullName}</p>
              <p className="text-xs text-slate-400">
                {currentUser.email} · {currentUser.role}
              </p>
            </div>

            <form action={backofficeSignOut}>
              <Button type="submit" variant="outline" className="border-slate-700 bg-transparent">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
