"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BackofficeRestaurantDetail } from "@/app/api/useCases/backoffice";
import { Select } from "../ui/select";

interface BackofficeRestaurantEditorProps {
  restaurant: BackofficeRestaurantDetail;
}

export function BackofficeRestaurantEditor({ restaurant }: BackofficeRestaurantEditorProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setMessage("");
    setError("");

    const response = await fetch(`/api/backoffice/restaurants/${restaurant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        ownerFullName: formData.get("ownerFullName"),
        email: formData.get("email"),
        phoneNumber: formData.get("phoneNumber"),
        address: formData.get("address"),
        addressNumber: formData.get("addressNumber"),
        complement: formData.get("complement"),
        province: formData.get("province"),
        postalCode: formData.get("postalCode"),
        lifecycleStatus: formData.get("lifecycleStatus"),
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.isValid) {
      setError(payload?.errorMessages?.[0] ?? "Nao foi possivel atualizar o restaurante.");
      setPending(false);
      return;
    }

    setMessage("Cadastro atualizado com sucesso.");
    setPending(false);
    router.refresh();
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-lg font-semibold">Editar cadastro</h2>
      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void handleSubmit(new FormData(event.currentTarget));
        }}
        className="mt-4 grid gap-3 md:grid-cols-2"
      >
        <Input name="name" defaultValue={restaurant.name} className="bg-slate-950" />
        <Input
          name="ownerFullName"
          defaultValue={restaurant.ownerFullName}
          className="bg-slate-950"
        />
        <Input name="email" defaultValue={restaurant.email} className="bg-slate-950" />
        <Input
          name="phoneNumber"
          defaultValue={restaurant.phoneNumber}
          className="bg-slate-950"
        />
        <Input name="address" defaultValue={restaurant.address} className="bg-slate-950" />
        <Input
          name="addressNumber"
          defaultValue={restaurant.addressNumber}
          className="bg-slate-950"
        />
        <Input
          name="complement"
          defaultValue={restaurant.complement}
          className="bg-slate-950"
        />
        <Input name="province" defaultValue={restaurant.province} className="bg-slate-950" />
        <Input
          name="postalCode"
          defaultValue={restaurant.postalCode}
          className="bg-slate-950"
        />
        <Select
          name="lifecycleStatus"
          defaultValue={restaurant.lifecycleStatus}
        >
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="cancelled">Cancelado</option>
        </Select>

        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar cadastro"}
          </Button>
        </div>
      </form>

      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </section>
  );
}

