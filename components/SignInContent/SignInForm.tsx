"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Cover from "@/assets/cover.jpeg";
import Google from "@/assets/google.svg";
import { ComponentProps, FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface SignInFormProps extends ComponentProps<"div"> {
  onSignIn: (formData: FormData) => void;
  googleSignIn: () => void;
}

export function SignInForm({ className, googleSignIn, onSignIn, ...props }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSignIn(new FormData(e.currentTarget));
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden bg-background-default">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="mb-12 mt-8 flex flex-col justify-center gap-4 px-6 md:px-8">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Olá Cheffia</h1>
                  <p className="text-balance text-xl text-foreground-default/70">Acesse a sua conta</p>
                </div>

                <div className="mb-2 grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="cheffia@email.com"
                    required
                    className="w-full rounded-xl font-medium transition-all duration-800"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Senha</Label>
                    <div className="ml-auto flex items-center gap-3 text-sm text-foreground-white">
                      <a
                        href="/forgot-password"
                        className="underline-offset-4 hover:text-primary hover:underline"
                      >
                        Esqueci minha senha
                      </a>
                    </div>
                  </div>

                  <InputGroup>
                    <InputGroupInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      className="rounded-l-xl"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl bg-button text-lg font-semibold text-foreground-black hover:bg-button-dark hover:text-foreground-default"
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

              <div className="flex items-center justify-center">
                <Button
                  onClick={googleSignIn}
                  variant="outline"
                  className="w-full rounded-xl font-semibold text-foreground-default"
                >
                  <Image src={Google} alt="Login with Google" width={20} height={20} />
                  <span>Entrar com Google</span>
                </Button>
              </div>

              <div className="text-center text-sm">
                Não tem uma conta?{" "}
                <a href="/sign-up" className="underline-offset-4 hover:text-primary hover:underline">
                  Inscreva-se
                </a>
              </div>
            </div>
          </div>

          <div className="relative hidden bg-muted md:block">
            <Image src={Cover} alt="Image" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        Ao clicar em continuar, você concorda com nossos <a href="#">Termos de Serviço</a> e{" "}
        <a href="#">Política de Privacidade</a>.
      </div>
    </div>
  );
}
