"use client";

import LoadingSpin from "@/assets/loading-spin.svg";
import { Form } from "@/components/ui/form";
import { UseRegisterRestaurantForm } from "@/hooks/UseForms";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import RestaurantFormField from "./RestaurantFormField";
import { registerRestaurantFromForm } from "@/lib/api/restaurantClient";
import { useRouter } from "next/navigation";
import type { RegisterRestaurantFormData } from "@/types/formTypes";

interface RegisterRestaurantFormProps {
  ownerFullName?: string;
  avatarUrl?: string;
  email: string;
  emailVerified: boolean;
  id: string;
}

export default function RegisterRestaurantForm({
  ownerFullName,
  email,
  id,
  avatarUrl,
  emailVerified,
}: RegisterRestaurantFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = UseRegisterRestaurantForm({
    ownerFullName,
    email,
    id,
    avatarUrl,
    emailVerified,
  });

  const documentDigits = form.watch("document").replace(/\D/g, "");
  const isCompanyDocument = documentDigits.length > 11;

  const buildPayload = (values: RegisterRestaurantFormData): RegisterRestaurantFormData => {
    const isCompany = values.document.replace(/\D/g, "").length > 11;

    return {
      ...values,
      ownerFullName: ownerFullName || values.ownerFullName,
      email: email,
      emailVerified: emailVerified,
      providerAvatarUrl: avatarUrl || "",
      supabaseId: id,
      birthDate: isCompany ? undefined : values.birthDate || undefined,
      companyType: isCompany ? values.companyType || undefined : undefined,
    };
  };

  // TODO: add tratativa de erro para o caso de restaurante já cadastrado;
  // TODO: add tratativa de erro para o caso de erro no cadastro do restaurante;
  // TODO: Add Redirect para a página de dashboard após o cadastro do restaurante;
  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setLoading(true);
      await registerRestaurantFromForm(buildPayload(values));
      toast.success("Restaurante cadastrado", {
        description: "Seu restaurante foi cadastrado e os dados já alimentam o onboarding financeiro no Asaas.",
      });
      form.reset();
      setLoading(false);

      setTimeout(() => {
        router.push(`/dashboard/${id}`);
      }, 3000);
    } catch (error) {
      console.error("Failed to register restaurant:", error);
      toast.error("Ocorreu um erro ao cadastrar", {
        description: "Não foi possível cadastrar o restaurante, tente novamente.",
      });
      setLoading(false);
    }
  });

  return (
    <div className="mx-auto my-6 border border-zinc-600 rounded-xl p-10 overflow-hidden bg-background-default">
      <h2 className="scroll-m-20 border-b border-primary pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Cadastre seu restaurante
      </h2>
      <p className="mt-4 text-sm text-muted-foreground">
        Este cadastro já prepara a sua conta financeira: endereço, documento, titularidade e dados operacionais serão reaproveitados no onboarding do Asaas.
      </p>

      <Form {...form}>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col w-full gap-6 mt-12 mb-12 mx-auto">
            <RestaurantFormField
              control={form.control}
              name="name"
              type="text"
              label="Nome do restaurante"
              placeholder="Nome do restaurante"
              errorMessage={form.formState.errors.name?.message}
              blurEvent={async () => {
                await form.trigger("name");
              }}
            />

            <RestaurantFormField
              control={form.control}
              name="address"
              label="Rua ou avenida"
              type="text"
              placeholder="Av. Paulista"
              errorMessage={form.formState.errors.address?.message}
              blurEvent={async () => {
                await form.trigger("address");
              }}
            />

            <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
              <RestaurantFormField
                control={form.control}
                name="province"
                label="Bairro"
                type="text"
                placeholder="Bela Vista"
                errorMessage={form.formState.errors.province?.message}
                blurEvent={async () => {
                  await form.trigger("province");
                }}
              />

              <RestaurantFormField
                control={form.control}
                name="addressNumber"
                label="Número"
                type="text"
                placeholder="1000"
                errorMessage={form.formState.errors.addressNumber?.message}
                blurEvent={async () => {
                  await form.trigger("addressNumber");
                }}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <RestaurantFormField
                control={form.control}
                name="postalCode"
                label="CEP"
                type="text"
                placeholder="01310-100"
                errorMessage={form.formState.errors.postalCode?.message}
                blurEvent={async () => {
                  await form.trigger("postalCode");
                }}
                changeEventType="postalCode"
              />

              <RestaurantFormField
                control={form.control}
                name="complement"
                label="Complemento"
                type="text"
                placeholder="Sala 2"
                errorMessage={form.formState.errors.complement?.message}
                blurEvent={async () => {
                  await form.trigger("complement");
                }}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <RestaurantFormField
                control={form.control}
                name="phoneNumber"
                label="Telefone"
                type="text"
                placeholder="(11) 99999-9999"
                errorMessage={form.formState.errors.phoneNumber?.message}
                blurEvent={async () => {
                  await form.trigger("phoneNumber");
                }}
                changeEventType="phone"
              />

              <RestaurantFormField
                control={form.control}
                name="document"
                label="CPF ou CNPJ"
                placeholder="Documento"
                type="text"
                errorMessage={form.formState.errors.document?.message}
                blurEvent={async () => {
                  await form.trigger("document");
                }}
                changeEventType="document"
              />
            </div>

            {!ownerFullName && (
              <RestaurantFormField
                control={form.control}
                name="ownerFullName"
                label="Nome do proprietário"
                type="text"
                placeholder="Nome do proprietário"
                errorMessage={form.formState.errors.ownerFullName?.message}
                blurEvent={async () => {
                  await form.trigger("ownerFullName");
                }}
              />
            )}

            {isCompanyDocument ? (
              <RestaurantFormField
                control={form.control}
                name="companyType"
                label="Tipo da empresa no Asaas"
                placeholder="Ex.: MEI"
                type="text"
                errorMessage={form.formState.errors.companyType?.message}
                blurEvent={async () => {
                  await form.trigger("companyType");
                }}
              />
            ) : (
              <RestaurantFormField
                control={form.control}
                name="birthDate"
                label="Data de nascimento do titular"
                placeholder="AAAA-MM-DD"
                type="date"
                errorMessage={form.formState.errors.birthDate?.message}
                blurEvent={async () => {
                  await form.trigger("birthDate");
                }}
              />
            )}
          </div>
          <div className="flex justify-center">
            <Button
              type="submit"
              className=" bg-button hover:bg-button-solid hover:text-background rounded-xl text-foreground-default h-16 w-[90%] text-2xl font-bold transition-all duration-900"
              disabled={!form.formState.isValid || loading}
            >
              {loading ? (
                <Image
                  src={LoadingSpin}
                  alt="Loading"
                  className="h-12 w-12 animate-spin"
                />
              ) : (
                "Cadastrar"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}







