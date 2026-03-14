"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResendConfirmationForm() {
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
      const response = await fetch("/api/v1/auth/resend-confirmation", {
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
        setErrorMessage(payload.errorMessages?.[0] ?? "Nao foi possivel reenviar a confirmacao.");
        return;
      }

      setSuccessMessage(
        payload.successMessages?.[0] ??
          "Se a conta ainda precisar de confirmacao, enviamos um novo link."
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
        <CardTitle className="text-2xl">Reenviar confirmacao</CardTitle>
        <CardDescription>
          Use este fluxo quando a conta existir, mas o email de confirmacao nao tiver chegado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="resend-confirmation-email">Email</Label>
            <Input
              id="resend-confirmation-email"
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
            {submitting ? "Enviando..." : "Reenviar email"}
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
