"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { authFormSchema, authRecoverySchema, type AuthFormValues } from "@/business/auth/validation"
import { getAuthErrorMessage } from "@/business/auth/error-message"
import SmoothForm, {
  FormControl as SmoothFormControl,
  FormField as SmoothFormField,
  FormLabel as SmoothFormLabel,
  FormMessage as SmoothFormMessage,
} from "@/components/smoothui/form"
import Badge from "@/components/smoothui/badge"
import DotMorphButton from "@/components/smoothui/dot-morph-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import "./auth-form-a11y.css"

type AuthMode = "sign-in" | "sign-up"

interface AuthFormProps {
  initialMode: AuthMode
  onSignIn: (credentials: { email: string; password: string }) => void | Promise<void>
  onSignUp: (credentials: { email: string; password: string }) => void | Promise<void>
  onRequestPasswordReset?: (email: string) => void | Promise<void>
}

export function AuthForm({ initialMode, onSignIn, onSignUp, onRequestPasswordReset }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false)
  const [recoverySubmitted, setRecoverySubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const isSignUp = mode === "sign-up"
  const resolver = useMemo(
    () => zodResolver(isRecoveringPassword ? authRecoverySchema : authFormSchema(isSignUp)),
    [isRecoveringPassword, isSignUp],
  )
  const form = useForm<AuthFormValues>({
    resolver,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  })
  const isSubmitting = form.formState.isSubmitting
  const errors = Object.fromEntries(
    Object.entries(form.formState.errors).map(([field, issue]) => [field, issue?.message]),
  ) as Record<string, string | undefined>

  const submitValidForm = async ({ email, password }: AuthFormValues) => {
    form.clearErrors("root")
    try {
      if (isRecoveringPassword) {
        if (!onRequestPasswordReset) {
          form.setError("root", { message: "A recuperação de senha está temporariamente indisponível. Tente novamente mais tarde." })
          return
        }
        await onRequestPasswordReset(email.trim())
        setRecoverySubmitted(true)
        return
      }
      const credentials = { email: email.trim(), password }
      if (isSignUp) await onSignUp(credentials)
      else await onSignIn(credentials)
    } catch (error) {
      form.setError("root", {
        type: "server",
        message: getAuthErrorMessage(error as { code?: unknown; status?: unknown; message?: unknown }, isSignUp ? "sign-up" : "sign-in"),
      })
    }
  }

  const switchMode = (nextMode: AuthMode) => {
    setIsRecoveringPassword(false)
    setRecoverySubmitted(false)
    setMode(nextMode)
    form.clearErrors()
    form.setValue("confirmPassword", "", { shouldValidate: false })
  }

  return (
    <main className="auth-page grid min-h-svh w-full bg-background-default lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
      <section className="hidden min-h-svh flex-col justify-between gap-6 bg-background-missionAndValues px-6 py-7 sm:px-10 sm:py-9 lg:flex lg:px-12 lg:py-10 xl:px-16">
        <div className="flex items-center justify-between">
          <Image src="/assets/Icons/logo-horizontal.svg" alt="Marca Cheffia" width={160} height={44} priority className="h-10 w-auto sm:h-11" />
          <span className="hidden font-inter text-xs font-medium uppercase tracking-[0.18em] text-foreground-default/55 sm:block">Gestão à mesa</span>
        </div>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-8 lg:py-10">
          <DotMorphButton
            label="Feito para quem faz acontecer"
            onClick={() => document.querySelector<HTMLInputElement>('.auth-page input[name="email"]')?.focus()}
            className="mb-5 -ml-3 min-h-11 w-fit self-start gap-2 px-3 font-inter text-xs font-semibold uppercase tracking-[0.16em] text-foreground-default hover:bg-foreground-default/5 hover:text-foreground-default"
          />
          <h1 className="max-w-2xl font-clash text-[32px] font-semibold leading-none text-foreground-default sm:text-h1 [text-wrap:balance]">
            Da mesa à cozinha,<br />tudo no mesmo<br className="hidden sm:block" /> <span className="text-primary">ritmo.</span>
          </h1>
          <p className="mt-5 max-w-lg font-inter text-base leading-relaxed text-foreground-default/70 sm:mt-6 sm:text-lg [text-wrap:pretty]">Organize o atendimento, dê contexto para a equipe e acompanhe cada pedido sem perder o fio da operação.</p>
          <figure className="relative mt-8 aspect-[1.75/1] w-full overflow-hidden bg-background-card sm:mt-9">
            <Image src="/assets/images/auth-chef-plating.webp" alt="Chef finalizando pratos em uma cozinha" fill sizes="(min-width: 1280px) 44vw, 48vw" className="object-cover object-center" />
            <Badge variant="outline" className="absolute bottom-3 right-3 max-w-[65%] whitespace-normal border-foreground-default/80 bg-transparent px-3 py-2 font-inter text-xs font-medium uppercase leading-tight tracking-[0.04em] text-foreground-default [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] sm:bottom-4 sm:right-4">
              NOS BASTIDORES, TUDO SE CONECTA.
            </Badge>
          </figure>
        </div>
        <p className="font-inter text-xs text-foreground-default/50">© 2026 Cheffia <span className="mx-2 text-primary">/</span> Mais presença. Menos ruído.</p>
      </section>

      <section className="relative flex min-h-svh items-center justify-center px-6 pb-10 pt-24 sm:px-10 sm:pb-12 lg:border-l lg:border-border-default lg:px-12 lg:py-16">
        <Link href="/" className="absolute left-6 top-6 inline-flex min-h-11 items-center gap-2 font-inter text-sm text-foreground-default/60 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-10 lg:left-12 lg:top-7">
          <ArrowLeft size={18} aria-hidden="true" />
          Voltar ao site
        </Link>
        <div className="w-full max-w-md">
          <div className="mb-9">
            <p className="mb-3 font-inter text-xs font-semibold uppercase tracking-[0.2em] text-primary">Sua operação começa aqui</p>
            <h2 className="font-clash text-h2 font-normal text-foreground-default [text-wrap:balance]">{isRecoveringPassword ? "Recuperar senha" : isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}</h2>
            <p className="mt-3 font-inter text-base leading-relaxed text-foreground-default/65">{isRecoveringPassword ? "Informe seu email para continuar com a recuperação do acesso." : isSignUp ? "Comece a organizar sua operação com a Cheffia." : "Entre para continuar cuidando da sua operação."}</p>
          </div>

          {!isRecoveringPassword && <div className="mb-8 grid grid-cols-2 border-b border-border-default" role="group" aria-label="Escolha entrar ou criar conta">
            <Button type="button" variant="ghost" aria-pressed={!isSignUp} onClick={() => switchMode("sign-in")} className={`min-h-11 rounded-none border-b-2 font-inter text-sm hover:bg-foreground-default/5 hover:text-foreground-default ${!isSignUp ? "border-primary bg-primary/10 font-semibold text-foreground-default" : "border-border-default font-medium text-foreground-default/80"}`}>Entrar</Button>
            <Button type="button" variant="ghost" aria-pressed={isSignUp} onClick={() => switchMode("sign-up")} className={`min-h-11 rounded-none border-b-2 font-inter text-sm hover:bg-foreground-default/5 hover:text-foreground-default ${isSignUp ? "border-primary bg-primary/10 font-semibold text-foreground-default" : "border-border-default font-medium text-foreground-default/80"}`}>Criar conta</Button>
          </div>}

          <SmoothForm
            errors={errors}
            onFormSubmit={form.handleSubmit(submitValidForm)}
            className="space-y-5"
          >
            <SmoothFormField name="email" className="space-y-2">
              <SmoothFormLabel className="font-inter text-sm font-medium text-foreground-default">Email</SmoothFormLabel>
              <SmoothFormControl>
                <Input {...form.register("email")} type="email" autoComplete="email" placeholder="voce@restaurante.com" className="h-12 border-border-default bg-transparent px-3 font-inter text-foreground-default placeholder:text-foreground-default/50 focus-visible:border-primary focus-visible:ring-primary/25" />
              </SmoothFormControl>
              <SmoothFormMessage className="rounded-md bg-destructive px-3 py-2 font-inter text-sm leading-snug text-destructive-foreground" />
            </SmoothFormField>

            {!isRecoveringPassword && <SmoothFormField name="password" className="space-y-2">
              <SmoothFormLabel className="font-inter text-sm font-medium text-foreground-default">Senha</SmoothFormLabel>
              <div className="relative">
                <SmoothFormControl>
                  <Input {...form.register("password")} type={showPassword ? "text" : "password"} autoComplete={isSignUp ? "new-password" : "current-password"} placeholder="Sua senha" className="h-12 border-border-default bg-transparent px-3 pr-12 font-inter text-foreground-default placeholder:text-foreground-default/50 focus-visible:border-primary focus-visible:ring-primary/25" />
                </SmoothFormControl>
                <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm text-foreground-default/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
              </div>
               <SmoothFormMessage className="rounded-md bg-destructive px-3 py-2 font-inter text-sm leading-snug text-destructive-foreground" />
            </SmoothFormField>}

            {!isRecoveringPassword && isSignUp && <SmoothFormField name="confirmPassword" className="space-y-2">
              <SmoothFormLabel className="font-inter text-sm font-medium text-foreground-default">Confirme sua senha</SmoothFormLabel>
              <div className="relative">
                <SmoothFormControl>
                  <Input {...form.register("confirmPassword")} type={showConfirmation ? "text" : "password"} autoComplete="new-password" placeholder="Repita sua senha" className="h-12 border-border-default bg-transparent px-3 pr-12 font-inter text-foreground-default placeholder:text-foreground-default/50 focus-visible:border-primary focus-visible:ring-primary/25" />
                </SmoothFormControl>
                <button type="button" aria-label={showConfirmation ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"} aria-pressed={showConfirmation} onClick={() => setShowConfirmation(!showConfirmation)} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm text-foreground-default/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{showConfirmation ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
              </div>
               <SmoothFormMessage className="rounded-md bg-destructive px-3 py-2 font-inter text-sm leading-snug text-destructive-foreground" />
            </SmoothFormField>}

            {!isRecoveringPassword && !isSignUp && <button type="button" onClick={() => { setIsRecoveringPassword(true); setRecoverySubmitted(false); form.clearErrors(); }} className="justify-self-start text-sm font-semibold text-primary underline-offset-4 hover:underline">Esqueceu sua senha?</button>}

            {form.formState.errors.root?.message && <p role="alert" className="rounded-md bg-destructive px-3 py-2 font-inter text-sm leading-snug text-destructive-foreground">{form.formState.errors.root.message}</p>}
            {recoverySubmitted && <p role="status" className="font-inter text-sm text-foreground-default">Se houver uma conta associada a esse email, confira sua caixa de entrada para instruções de recuperação.</p>}
            {!recoverySubmitted && <Button type="submit" loading={isSubmitting} loadingLabel={isRecoveringPassword ? "Enviando..." : isSignUp ? "Criando conta..." : "Entrando..."} className="group h-12 w-full font-inter text-sm font-semibold active:scale-[0.96]">
              {isRecoveringPassword ? "Enviar instruções" : isSignUp ? "Criar minha conta" : "Entrar no app"}
              {!isSubmitting && <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />}
            </Button>}
          </SmoothForm>

          {isRecoveringPassword && <button type="button" onClick={() => { setIsRecoveringPassword(false); setRecoverySubmitted(false); form.clearErrors(); }} className="mt-8 block w-full text-center text-sm font-semibold text-primary underline-offset-4 hover:underline">Voltar para entrar</button>}
           <p className="mt-8 text-center font-inter text-xs leading-relaxed text-foreground-default/70">
             Ao continuar, você concorda com os <span className="text-primary">Termos de Serviço</span> e a <span className="text-primary">Política de Privacidade</span> da Cheffia.
             <span className="mt-1 block">Documentos ainda não disponíveis.</span>
           </p>
        </div>
      </section>
    </main>
  )
}
