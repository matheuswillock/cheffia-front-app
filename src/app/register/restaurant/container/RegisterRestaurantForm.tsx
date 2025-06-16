"use client";

import LoadingSpin from "@/assets/loading-spin.svg";
import { Form } from "@/components/ui/form";
import { UseRegisterRestaurantForm } from "@/hooks/UseForms";
import { Button } from "@/components/ui/button";
import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Alert from "@/components/ui/Alert";
import RestaurantFormField from "./RestaurantFormField";
import { handleRegisterRestaurant } from "@/business/restaurant/restaurantBusiness";
import { useRouter } from "next/navigation";

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
  const [closeAlertSuccess, setCloseAlertSuccess] = useState(false);
  const [closeAlertFail, setCloseAlertFail] = useState(false);
  const router = useRouter();

  const form = UseRegisterRestaurantForm({
    ownerFullName,
    email,
    id,
    avatarUrl,
    emailVerified,
  });

  const dataToSubmit = (e: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    return {
      ownerFullName: ownerFullName || (formData.get("ownerFullName") as string),
      email: email,
      emailVerified: emailVerified,
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      providerAvatarUrl: avatarUrl || "",
      supabaseId: id,
      document: formData.get("document") as string,
    };
  };

  console.log('dataToSubmit', dataToSubmit);

  useEffect(() => {
    console.log('form.formState.isValid', form.formState.isValid)
  }, [form.formState.isValid]);

  // TODO: add tratativa de erro para o caso de restaurante já cadastrado;
  // TODO: add tratativa de erro para o caso de erro no cadastro do restaurante;
  // TODO: Add Redirect para a página de dashboard após o cadastro do restaurante;
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      setLoading(true);
      const response = await handleRegisterRestaurant(dataToSubmit(e));
      console.log(response);
      setCloseAlertSuccess(true);
      form.reset();
      setLoading(false);

      setTimeout(() => {
        setCloseAlertSuccess(false);
        console.log("Redirecting to dashboard...", `/dashboard/${response.RestaurantId}`);
        router.push(`/dashboard/${id}`);
      }, 3000);
    } catch (error) {
      console.error("Failed to register restaurant:", error);
      setCloseAlertFail(true);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto my-6 border border-zinc-600 rounded-xl p-10 overflow-hidden bg-background-default">
      <h2 className="scroll-m-20 border-b border-primary pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Cadastre seu restaurante
      </h2>

      <Alert
        IsOpen={closeAlertSuccess}
        SetCloseAlert={setCloseAlertSuccess}
        Title="Restaurante cadastrado"
        Message="Seu restaurante foi cadastrado com sucesso!"
        type="success"
      />

      <Alert
        IsOpen={closeAlertFail}
        SetCloseAlert={setCloseAlertFail}
        Title="Ocorreu um erro ao cadastrar"
        Message="Não foi possível cadastrar o restaurante, tente novamente."
        type="fail"
      />

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
              label="Endereço"
              type="text"
              placeholder="Endereço"
              errorMessage={form.formState.errors.address?.message}
              blurEvent={async () => {
                await form.trigger("address");
              }}
            />

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

            <RestaurantFormField
              control={form.control}
              name="document"
              label="Documento"
              placeholder="Documento"
              type="text"
              errorMessage={form.formState.errors.document?.message}
              blurEvent={async () => {
                await form.trigger("document");
              }}
              changeEventType="document"
            />
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