"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as {
        successMessages?: string[];
        errorMessages?: string[];
      };

      if (!response.ok) {
        setErrorMessage(payload.errorMessages?.[0] ?? "Nao foi possivel enviar o email.");
        return;
      }

      setSuccessMessage(
        payload.successMessages?.[0] ??
          "Se existir uma conta com esse email, enviamos um link para redefinir a senha."
      );
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
        <CardTitle className="text-2xl">Redefinir senha</CardTitle>
        <CardDescription>
          Informe o email da sua conta para receber um link seguro de recuperacao.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="forgot-password-email">Email</Label>
            <Input
              id="forgot-password-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="cheffia@email.com"
              required
            />
          </div>

          {successMessage ? <p className="text-sm text-emerald-400">{successMessage}</p> : null}
          {errorMessage ? <p className="text-sm text-rose-400">{errorMessage}</p> : null}

          <Button className="w-full rounded-xl" disabled={submitting} type="submit">
            {submitting ? "Enviando..." : "Enviar link"}
          </Button>

          <div className="text-sm text-foreground-default/70">
            <a className="underline-offset-4 hover:text-primary hover:underline" href="/sign-in">
              Voltar para o login
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
