"use client"

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Cover from "@/assets/cover.jpeg";
import Google from "@/assets/google.svg";
import { ComponentProps, FormEvent } from "react";

interface SignInFormProps extends ComponentProps<"div"> {
  onSignIn: (formData: FormData) => void;
  googleSignIn: () => void;
}

export function SignInForm({
  className,
  googleSignIn,
  onSignIn,
  ...props
}: SignInFormProps) {

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSignIn(new FormData(e.currentTarget));
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden bg-background-default">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="px-6 md:px-8 mb-12 mt-8 gap-4 flex flex-col justify-center">
            <form  onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Olá Cheffia</h1>
                  <p className="text-balance text-xl  text-foreground-default/70">
                    Acesse a sua conta
                  </p>
                </div>

                <div className="grid gap-2 mb-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="cheffia@email.com"
                    required
                    className="w-full font-medium transition-all duration-800 rounded-xl"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Senha</Label>
                    <div className="ml-auto flex items-center gap-3 text-sm">
                      <a
                        href="/forgot-password"
                        className="underline-offset-4 hover:underline hover:text-primary"
                      >
                        Esqueceu a sua senha?
                      </a>
                      <a
                        href="/resend-confirmation"
                        className="underline-offset-4 hover:underline hover:text-primary"
                      >
                        Reenviar confirmacao
                      </a>
                    </div>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    required
                    className="w-full font-medium transition-all duration-800 rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl text-lg font-semibold bg-button text-foreground-default hover:bg-button-solid hover:text-background"
                >
                  Login
                </Button>
              </div>
            </form>

            <div className="flex flex-col gap-4">

              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border-default">
                <span className="relative z-10 bg-background-default px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>

              <div className="flex justify-center items-center">
                <Button 
                  onClick={googleSignIn}
                  variant="outline" 
                  className="w-full rounded-xl font-semibold"
                >
                  <Image
                    src={Google}
                    alt={"Login with Google"}
                    width={20}
                    height={20}
                  />
                  <span className="">Entrar com Google</span>
                </Button>
              </div>

              <div className="text-center text-sm">
                Não tem uma conta?{" "}
                <a
                  href="/sign-up"
                  className="hover:underline underline-offset-4 hover:text-primary "
                >
                  Inscreva-se
                </a>
              </div>

            </div>

          </div>

          <div className="relative hidden bg-muted md:block">
            <Image
              src={Cover}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <div 
        className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary"
      >
        Ao clicar em continuar, você concorda com nossos{" "}
        <a href="#">Termos de Serviço</a> e{" "}
        <a href="#">Política de Privacidade</a>.
      </div>

    </div>
  );
}
