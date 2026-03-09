"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OutputMenu } from "@/server/application/menu";

interface BackofficeMenuManagerProps {
  restaurantId: string;
  menu: OutputMenu | null;
}

export function BackofficeMenuManager({ restaurantId, menu }: BackofficeMenuManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (formData: FormData) => {
    setPending(true);
    setMessage("");
    setError("");

    const ingredientsValue = String(formData.get("ingredients") ?? "");
    const ingredients = ingredientsValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await fetch(`/api/backoffice/restaurants/${restaurantId}/menu/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        description: formData.get("description"),
        price: Number(formData.get("price")),
        ingredients,
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.isValid) {
      setError(payload?.errorMessages?.[0] ?? "Nao foi possivel adicionar o item.");
      setPending(false);
      return;
    }

    setMessage("Item adicionado com sucesso.");
    setPending(false);
    router.refresh();
  };

  const handleDelete = async (itemId: string) => {
    setDeletingId(itemId);
    setMessage("");
    setError("");

    const response = await fetch(
      `/api/backoffice/restaurants/${restaurantId}/menu/items/${itemId}`,
      { method: "DELETE" }
    );

    const payload = await response.json();
    if (!response.ok || !payload?.isValid) {
      setError(payload?.errorMessages?.[0] ?? "Nao foi possivel remover o item.");
      setDeletingId(null);
      return;
    }

    setMessage("Item removido com sucesso.");
    setDeletingId(null);
    router.refresh();
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Cardapio</h2>
          <p className="text-sm text-slate-400">
            Edicao rapida de itens do restaurante pelo portal interno.
          </p>
        </div>
        <span className="text-sm text-slate-400">{menu?.items.length ?? 0} itens</span>
      </div>

      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void handleAdd(new FormData(event.currentTarget));
        }}
        className="mt-4 grid gap-3 md:grid-cols-2"
      >
        <Input name="name" placeholder="Nome do item" className="bg-slate-950" required />
        <Input
          name="price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          className="bg-slate-950"
          required
        />
        <Textarea
          name="description"
          placeholder="Descricao"
          className="min-h-24 bg-slate-950 md:col-span-2"
        />
        <Input
          name="ingredients"
          placeholder="Ingredientes separados por virgula"
          className="bg-slate-950 md:col-span-2"
        />
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Adicionando..." : "Adicionar item"}
          </Button>
        </div>
      </form>

      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      <div className="mt-6 space-y-3">
        {(menu?.items ?? []).map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-slate-400">{item.description}</p>
              <p className="text-sm text-slate-500">
                R$ {item.price.toFixed(2)} · {(item.ingredients ?? []).join(", ") || "Sem ingredientes"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-red-700 text-red-300"
              disabled={deletingId === item.id}
              onClick={() => handleDelete(item.id)}
            >
              {deletingId === item.id ? "Removendo..." : "Remover"}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
