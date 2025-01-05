"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Link } from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  name: z
    .string()
    .min(3, "O nome do restaurante deve ter no mínimo 3 caracteres"),
  address: z
    .string()
    .min(4, "O endereço deve ter no mínimo 4 caracteres")
    .regex(/^[^.+\-*/!@#$%^&*()_={}\|?><:;"'~`]+$/, "O endereço não pode conter caracteres especiais"),
  phoneNumber: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Insira um número de telefone válido"),
  email: z
    .string()
    .email("Digite um email válido")
    .min(1, "O email é obrigatório"),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caracter especial"),
  ownerFullName: z
    .string()
    .min(3, "O nome do proprietário deve ter no mínimo 2 caracteres")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "O nome deve conter apenas letras"),
  document: z
    .string()
    .min(11, "O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)")
    .max(18, "O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)")
});

type FormData = z.infer<typeof formSchema>;

export default function RestaurantPage() {
  const [inputDocument, setinputDocument] = useState('');


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      phoneNumber: "",
      email: "",
      password: "",
      ownerFullName: "",
      document: "",
    },
  });

  const onSubmit = (data: FormData) => {
    data.document = data.document.replace(/[^0-9]/g, "");
    data.phoneNumber = data.phoneNumber.replace(/[^0-9]/g, "");
    console.log(data);
    // Aqui você pode implementar a lógica de envio dos dados
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-[810px] my-32 mx-auto"
        >
          <h2 className="text-5xl font-semibold text-left text-defaultForeground">
            Cadastre seu restaurante
          </h2>

          <div className="flex flex-col w-full gap-8 mt-20 mb-10 mx-auto">
            <FormField
              className="flex flex-col w-full my-11"
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className="text-3xl font-medium ml-2  ">
                    Nome do restaurante
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.name
                          ? "border-red-500"
                          : "border-zinc-800"
                      } focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Nome do restaurante"
                      onBlur={async () => {
                        await form.trigger("name");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-xl">
                    {form.formState.errors.name?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              className="flex flex-col w-full my-11"
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className="text-3xl font-medium ml-2  ">
                    Endereço
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.address
                          ? "border-red-500"
                          : "border-zinc-800"
                      } focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Endereço"
                      onBlur={async () => {
                        await form.trigger("address");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-xl">
                    {form.formState.errors.address?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              className="flex flex-col w-full my-11"
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className="text-3xl font-medium ml-2  ">
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.phoneNumber
                          ? "border-red-500"
                          : "border-zinc-800"
                      } focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="(11) 99999-9999"
                      onBlur={async () => {
                        await form.trigger("phoneNumber");
                      }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        const maskedValue =
                          value.length <= 10
                            ? value.replace(/^(\d{2})(\d{4})(\d)/, "($1) $2-$3")
                            : value.replace(
                                /^(\d{2})(\d{5})(\d)/,
                                "($1) $2-$3"
                              );
                        field.onChange(maskedValue);
                        e.target.value = maskedValue;
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-xl">
                    {form.formState.errors.phoneNumber?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              className="flex flex-col w-full my-11"
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className="text-3xl font-medium ml-2  ">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.email
                          ? "border-red-500"
                          : "border-zinc-800"
                      } focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Email"
                      onBlur={async () => {
                        await form.trigger("email");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-xl">
                    {form.formState.errors.email?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              className="flex flex-col w-full my-11"
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className="text-3xl font-medium ml-2 ">
                    Senha
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      className={`border-[1.5px] ${
                        form.formState.errors.password
                          ? "border-red-500"
                          : "border-zinc-800"
                      } focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Senha"
                      onBlur={async () => {
                        await form.trigger("password");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-xl">
                    {form.formState.errors.password?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              className="flex flex-col w-full my-11"
              control={form.control}
              name="ownerFullName"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className="text-3xl font-medium ml-2 ">
                    Nome do proprietário
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.ownerFullName
                          ? "border-red-500"
                          : "border-zinc-800"
                      } focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Nome do proprietário"
                      onBlur={async () => {
                        await form.trigger("ownerFullName");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-xl">
                    {form.formState.errors.ownerFullName?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              className="flex flex-col w-full my-11"
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className="text-3xl font-medium ml-2 ">
                    Documento
                  </FormLabel>
                    <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                      form.formState.errors.document
                      ? "border-red-500"
                      : "border-zinc-800"
                      } focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Documento"
                      onBlur={async () => {
                      await form.trigger("document");
                      }}
                      onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      let maskedValue = value;  

                      if (value.length <= 11) {
                        maskedValue = value.replace(
                        /(\d{3})(\d{3})(\d{3})(\d{2})/,
                        "$1.$2.$3-$4"
                        );
                      } else {
                        maskedValue = value.replace(
                        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                        "$1.$2.$3/$4-$5"
                        );
                      }

                      field.onChange(maskedValue);
                      }}
                    />
                    </FormControl>
                  <FormMessage className="ml-2 text-xl">
                    {form.formState.errors.document?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-center">
            <Button
              type="submit"
              className="bg-defaultButtonBackgroung hover:bg-defaultButtonDarkBakground rounded-xl text-defaultButtonColor h-20 w-[80%] text-4xl font-semibold transition-all duration-800"
              disabled={!form.formState.isValid}
            >
              Cadastrar
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
