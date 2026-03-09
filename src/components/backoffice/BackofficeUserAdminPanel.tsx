"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BackofficeUserOutput } from "@/server/application/backoffice";

interface BackofficeUserAdminPanelProps {
  users: BackofficeUserOutput[];
}

export function BackofficeUserAdminPanel({ users }: BackofficeUserAdminPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleCreate = async (formData: FormData) => {
    setCreating(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/backoffice/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role"),
      }),
    });

    const payload = await response.json();

    if (!response.ok || !payload?.isValid) {
      setError(payload?.errorMessages?.[0] ?? "Nao foi possivel criar o usuario.");
      setCreating(false);
      return;
    }

    setMessage("Usuario interno criado com sucesso.");
    setCreating(false);
    router.refresh();
  };

  const handleUpdate = async (userId: string, formData: FormData) => {
    setUpdatingId(userId);
    setError("");
    setMessage("");

    const response = await fetch(`/api/backoffice/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        role: formData.get("role"),
        isActive: formData.get("isActive") === "on",
      }),
    });

    const payload = await response.json();

    if (!response.ok || !payload?.isValid) {
      setError(payload?.errorMessages?.[0] ?? "Nao foi possivel atualizar o usuario.");
      setUpdatingId(null);
      return;
    }

    setMessage("Usuario atualizado com sucesso.");
    setUpdatingId(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Novo usuario interno</h2>
        <p className="mt-1 text-sm text-slate-400">
          O usuario sera criado no Supabase Auth e registrado na tabela exclusiva do backoffice.
        </p>

        <form
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void handleCreate(new FormData(event.currentTarget));
          }}
          className="mt-4 grid gap-3 md:grid-cols-2"
        >
          <Input name="fullName" placeholder="Nome completo" required className="bg-slate-950" />
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
            placeholder="Senha temporaria"
            required
            className="bg-slate-950"
          />
          <select
            name="role"
            defaultValue="operator"
            className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
          >
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
          </select>

          <div className="md:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar usuario"}
            </Button>
          </div>
        </form>
      </section>

      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Usuarios internos</h2>
        <div className="mt-4 space-y-4">
          {users.map((user) => (
            <form
              key={user.id}
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                void handleUpdate(user.id, new FormData(event.currentTarget));
              }}
              className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 md:grid-cols-[2fr_2fr_1fr_120px_120px]"
            >
              <Input
                name="fullName"
                defaultValue={user.fullName}
                className="bg-slate-900"
              />
              <Input value={user.email} readOnly className="bg-slate-900 text-slate-400" />
              <select
                name="role"
                defaultValue={user.role}
                className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm"
              >
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" name="isActive" defaultChecked={user.isActive} />
                Ativo
              </label>
              <Button type="submit" disabled={updatingId === user.id}>
                {updatingId === user.id ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
