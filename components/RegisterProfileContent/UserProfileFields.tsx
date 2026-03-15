"use client";

import type { Path, UseFormReturn } from "react-hook-form";
import SignUpFormField from "../SignUpContent/SignUpFormField";

type UserProfileFieldValues = {
  fullName: string;
  birthDate: string;
  document: string;
  role: string;
};

interface UserProfileFieldsProps<T extends UserProfileFieldValues> {
  form: UseFormReturn<T>;
}

const getFieldErrorMessage = (message: unknown): string | undefined =>
  typeof message === "string" ? message : undefined;

export default function UserProfileFields<T extends UserProfileFieldValues>({
  form,
}: UserProfileFieldsProps<T>) {
  return (
    <>
      <SignUpFormField
        control={form.control}
        name={"fullName" as Path<T>}
        label="Nome completo"
        type="text"
        placeholder="Maria da Silva"
        errorMessage={getFieldErrorMessage(form.formState.errors.fullName?.message)}
        blurEvent={async () => {
          await form.trigger("fullName" as Path<T>);
        }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SignUpFormField
          control={form.control}
          name={"birthDate" as Path<T>}
          label="Data de nascimento"
          type="date"
          placeholder="AAAA-MM-DD"
          errorMessage={getFieldErrorMessage(form.formState.errors.birthDate?.message)}
          blurEvent={async () => {
            await form.trigger("birthDate" as Path<T>);
          }}
        />

        <SignUpFormField
          control={form.control}
          name={"document" as Path<T>}
          label="Documento (CPF)"
          type="text"
          placeholder="000.000.000-00"
          errorMessage={getFieldErrorMessage(form.formState.errors.document?.message)}
          blurEvent={async () => {
            await form.trigger("document" as Path<T>);
          }}
          changeEventType="document"
        />
      </div>

      <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground-default/80">
        O perfil inicial sera salvo como <span className="font-semibold">master</span> (dono da conta).
      </p>
    </>
  );
}
