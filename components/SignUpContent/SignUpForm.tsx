"use client"

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Cover from "@/assets/cover.jpeg";
import Google from "@/assets/google.svg";
import { ComponentProps, FormEvent } from "react";
import { Form } from "../ui/form";
import SignUpFormField from "./SignUpFormField";
import { UseSignUpForm } from "@/hooks/UseForms";

interface SignInFormProps extends ComponentProps<"div"> {
  onSignUp: (formData: FormData) => void;
  googleSignUp: () => void;
}

export function SignUpForm({
  className,
  googleSignUp,
  onSignUp,
  ...props
}: SignInFormProps) {
  const form = UseSignUpForm();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSignUp(new FormData(e.currentTarget));
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden bg-background-default">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="px-6 md:px-8 mb-12 mt-8 gap-4 flex flex-col justify-center">
            <Form {...form}>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">
                      Olá Cheffia
                    </h1>
                    <p className="text-balance text-xl  text-foreground-default/70">
                      Crie uma conta
                    </p>
                  </div>

                  <SignUpFormField
                    control={form.control}
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="cheffia@email.com"
                    errorMessage={form.formState.errors.email?.message}
                    blurEvent={async () => {
                      await form.trigger("email");
                    }}
                  />

                  <SignUpFormField
                    control={form.control}
                    name="password"
                    label="Senha"
                    type="password"
                    placeholder="Digite sua senha"
                    errorMessage={form.formState.errors.password?.message}
                    blurEvent={async () => {
                      await form.trigger("password");
                    }}
                  />

                  <SignUpFormField
                    control={form.control}
                    name="confirmPassword"
                    label="Confirme a sua senha"
                    type="password"
                    placeholder="*******************"
                    errorMessage={form.formState.errors.confirmPassword?.message}
                    blurEvent={async () => {
                      await form.trigger("confirmPassword");
                    }}
                  />

                  <Button
                    type="submit"
                    className="w-full rounded-xl text-lg font-semibold bg-button text-foreground-default hover:bg-button-solid hover:text-background my-2"
                    disabled={!form.formState.isValid}
                  >
                    Criar conta
                  </Button>
                </div>
              </form>
            </Form>

            <div className="flex flex-col gap-4">
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border-default">
                <span className="relative z-10 bg-background-default px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>

              <div className="flex justify-center items-center">
                <Button
                  onClick={googleSignUp}
                  variant="outline"
                  className="w-full rounded-xl font-semibold text-foreground-default"
                >
                  <Image
                    src={Google}
                    alt={"Login with Google"}
                    width={20}
                    height={20}
                  />
                  <span>Criar conta com Google</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="relative hidden bg-muted md:block">
            <Image
              src={Cover}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>

      <div
        className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary"
      >
        Ao clicar em criar conta, você concorda com nossos{" "}
        <a href="#">Termos de Serviço</a> e{" "}
        <a href="#">Política de Privacidade</a>.
      </div>
    </div>
  );
}
