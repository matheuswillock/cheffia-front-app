"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import Alert from "../ui/Alert";
import { UseUserProfileForm } from "@/hooks/UseForms";
import UserProfileFields from "./UserProfileFields";
import { completeUserProfile } from "@/business/auth/actions";

interface RegisterProfileFormProps {
  email: string;
  initialFullName?: string;
}

export default function RegisterProfileForm({
  email,
  initialFullName,
}: RegisterProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const form = UseUserProfileForm({
    fullName: initialFullName ?? "",
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.set("fullName", values.fullName);
      formData.set("birthDate", values.birthDate);
      formData.set("document", values.document);
      formData.set("role", values.role);
      formData.set("jobTitle", values.jobTitle);
      formData.set("department", values.department);

      const response = await completeUserProfile(formData);

      if (!response.isValid) {
        throw new Error(response.errorMessages[0] ?? "Nao foi possivel concluir o perfil");
      }

      setSuccessOpen(true);

      setTimeout(() => {
        router.push("/register/restaurant");
      }, 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel concluir o perfil";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="mx-auto my-6 rounded-xl border border-zinc-600 bg-background-default p-10">
      <h2 className="scroll-m-20 border-b border-primary pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Complete o seu perfil
      </h2>

      <p className="mt-4 text-sm text-foreground-default/70">
        Conta autenticada: {email}
      </p>

      <p className="mt-2 text-sm text-foreground-default/70">
        O seu <span className="font-semibold">Cheffia ID</span> sera gerado automaticamente apos salvar.
      </p>

      <Alert
        IsOpen={successOpen}
        SetCloseAlert={setSuccessOpen}
        Title="Perfil salvo"
        Message="Seu perfil foi concluido com sucesso."
        type="success"
      />

      <Alert
        IsOpen={!!errorMessage}
        SetCloseAlert={() => setErrorMessage(null)}
        Title="Erro ao salvar o perfil"
        Message={errorMessage ?? ""}
        type="fail"
      />

      <Form {...form}>
        <form onSubmit={handleSubmit} className="mt-12">
          <div className="flex flex-col gap-6">
            <UserProfileFields form={form} />
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              type="submit"
              className="h-14 w-full rounded-xl bg-button text-lg font-semibold text-foreground-default hover:bg-button-solid hover:text-background md:w-[90%]"
              disabled={!form.formState.isValid || loading}
            >
              {loading ? "Salvando..." : "Salvar perfil"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
