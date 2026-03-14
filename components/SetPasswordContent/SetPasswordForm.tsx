"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      setHasSession(!error && Boolean(user));
      setUserEmail(user?.email ?? "");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!hasSession) {
      setErrorMessage("O link de recuperacao expirou ou ja foi consumido.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas precisam ser iguais.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage("Senha atualizada com sucesso. Redirecionando para o login...");
      window.setTimeout(() => {
        router.replace("/sign-in");
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border-default bg-background-default shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Criar nova senha</CardTitle>
        <CardDescription>
          {userEmail
            ? `Atualize a senha da conta ${userEmail}.`
            : "Use este formulario logo apos abrir o link de recuperacao."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="set-password-password">Nova senha</Label>
            <Input
              id="set-password-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite a nova senha"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="set-password-confirm">Confirmar senha</Label>
            <Input
              id="set-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a nova senha"
              required
            />
          </div>

          {hasSession === false ? (
            <p className="text-sm text-amber-400">
              O link nao esta mais valido. Solicite um novo email de recuperacao.
            </p>
          ) : null}
          {successMessage ? <p className="text-sm text-emerald-400">{successMessage}</p> : null}
          {errorMessage ? <p className="text-sm text-rose-400">{errorMessage}</p> : null}

          <Button className="w-full rounded-xl" disabled={submitting || hasSession === false} type="submit">
            {submitting ? "Atualizando..." : "Salvar nova senha"}
          </Button>

          <div className="flex items-center gap-4 text-sm text-foreground-default/70">
            <a className="underline-offset-4 hover:text-primary hover:underline" href="/forgot-password">
              Solicitar novo link
            </a>
            <a className="underline-offset-4 hover:text-primary hover:underline" href="/sign-in">
              Voltar para o login
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
