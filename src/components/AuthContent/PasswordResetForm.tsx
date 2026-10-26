"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { passwordResetSchema } from "@/business/auth/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SmoothForm, {
  FormControl as SmoothFormControl,
  FormField as SmoothFormField,
  FormLabel as SmoothFormLabel,
  FormMessage as SmoothFormMessage,
} from "@/components/smoothui/form"
import Image from "next/image"
import Link from "next/link"
import "./auth-form-a11y.css"

type ResetPasswordResult =
  | { success: true }
  | { success: false; error: "invalid-password" | "invalid-or-expired-link" }

interface PasswordResetFormProps {
  onPasswordUpdate: (formData: FormData) => Promise<ResetPasswordResult>
}

export function PasswordResetForm({ onPasswordUpdate }: PasswordResetFormProps) {
  const [updated, setUpdated] = useState(false)
  const form = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(passwordResetSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  })

  const submit = async (values: { password: string; confirmPassword: string }) => {
    const formData = new FormData()
    formData.set("password", values.password)
    formData.set("confirmPassword", values.confirmPassword)
    try {
      const result = await onPasswordUpdate(formData)
      if (result.success) {
        setUpdated(true)
      } else {
        form.setError("root", {
          message: result.error === "invalid-or-expired-link"
            ? "Este link de recuperação expirou ou já foi usado. Solicite um novo link e tente novamente."
            : "Confira os requisitos da senha e tente novamente.",
        })
      }
    } catch {
      form.setError("root", { message: "Não foi possível atualizar a senha. Solicite um novo link e tente novamente." })
    }
  }

  return (
    <main className="auth-page flex min-h-svh items-center justify-center bg-background-default px-5 py-10 text-foreground-default">
      <section className="w-full max-w-md">
        <Image src="/assets/Icons/logo-horizontal.svg" alt="Marca Cheffia" width={146} height={40} priority className="mb-10 h-10 w-auto" />
        {updated ? (
          <div className="space-y-5">
            <h1 className="font-clash text-4xl font-semibold">Senha atualizada</h1>
            <p role="status" className="font-inter text-base">Sua senha foi atualizada. Agora você pode entrar com a nova senha.</p>
            <Button asChild className="h-12 w-full"><Link href="/sign-in">Ir para entrar</Link></Button>
          </div>
        ) : (
          <>
            <h1 className="font-clash text-4xl font-semibold tracking-[-0.04em]">Crie uma nova senha</h1>
            <p className="mt-3 mb-8 font-inter text-base leading-relaxed">Use uma senha forte para proteger sua conta.</p>
            <SmoothForm errors={Object.fromEntries(Object.entries(form.formState.errors).map(([key, error]) => [key, error?.message])) as Record<string, string | undefined>} onFormSubmit={form.handleSubmit(submit)} className="space-y-5">
              <SmoothFormField name="password" className="space-y-2">
                <SmoothFormLabel className="font-inter text-sm font-medium text-foreground-default">Nova senha</SmoothFormLabel>
                <SmoothFormControl><Input {...form.register("password")} type="password" autoComplete="new-password" className="border-border-default bg-transparent text-foreground-default placeholder:text-foreground-default/80" /></SmoothFormControl>
                <SmoothFormMessage />
              </SmoothFormField>
              <SmoothFormField name="confirmPassword" className="space-y-2">
                <SmoothFormLabel className="font-inter text-sm font-medium text-foreground-default">Confirme a nova senha</SmoothFormLabel>
                <SmoothFormControl><Input {...form.register("confirmPassword")} type="password" autoComplete="new-password" className="border-border-default bg-transparent text-foreground-default placeholder:text-foreground-default/80" /></SmoothFormControl>
                <SmoothFormMessage />
              </SmoothFormField>
              {form.formState.errors.root?.message && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
              <Button type="submit" disabled={form.formState.isSubmitting} className="h-12 w-full">{form.formState.isSubmitting ? "Atualizando..." : "Salvar nova senha"}</Button>
            </SmoothForm>
          </>
        )}
      </section>
    </main>
  )
}
