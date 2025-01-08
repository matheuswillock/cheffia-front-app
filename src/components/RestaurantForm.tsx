"use client"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import LoadingSpin from "@/assets/loading-spin.svg";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { handleRegisterRestaurant } from "@/business/restaurant/restaurantBusiness";
import { formSchema } from "@/utils/validation";
import { FormData } from "@/types/formTypes";
import { useState } from "react";
import Image from "next/image";
import Alert from "./ui/Alert";



export default function RestaurantForm() {
  const [loading, setLoading] = useState(false);
  const [closeAlertSuccess, setCloseAlertSuccess] = useState(false);
  const [closeAlertFail, setCloseAlertFail] = useState(false);

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

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await handleRegisterRestaurant(data);
      console.log("Restaurant registered successfully:", response);
      setCloseAlertSuccess(true);
      form.reset();
    } catch (error) {
      console.error("Failed to register restaurant:", error);
      setCloseAlertFail(true);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto my-6 border border-zinc-600 rounded-xl p-10 overflow-hidden bg-background">
      <h2 className="scroll-m-20 border-b border-primary pb-2 text-4xl font-semibold tracking-tight first:mt-0">
        Cadastre seu restaurante
      </h2>

      <Alert
        IsOpen={closeAlertSuccess}
        SetCloseAlert={setCloseAlertSuccess}
        Title="Restaurante cadastrado"
        Message="Seu restaurante foi cadastrado com sucesso!"
        type="success"
      />

      <Alert
        IsOpen={closeAlertFail}
        SetCloseAlert={setCloseAlertFail}
        Title="Ocorreu um erro ao cadastrar"
        Message="Não foi possível cadastrar o restaurante, tente novamente."
        type="fail"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col w-full gap-6 mt-12 mb-12 mx-auto">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full items-start">
                  <FormLabel
                    className={`text-xl font-medium ml-2 ${
                      form.formState.errors.name && "text-red-600"
                    }`}
                  >
                    Nome do restaurante
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.name
                          ? "border-red-600"
                          : "border-zinc-800"
                      } h-14 w-full text-xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Nome do restaurante"
                      onBlur={async () => {
                        await form.trigger("name");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-xl text-red-600">
                    {form.formState.errors.name?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full items-start">
                  <FormLabel
                    className={`text-xl font-medium ml-2 ${
                      form.formState.errors.address && "text-red-600"
                    }`}
                  >
                    Endereço
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.address
                          ? "border-red-600"
                          : "border-zinc-800"
                      }   h-14 w-full text-xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Endereço"
                      onBlur={async () => {
                        await form.trigger("address");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-xl text-red-600">
                    {form.formState.errors.address?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full items-start">
                  <FormLabel
                    className={`text-xl font-medium ml-2 ${
                      form.formState.errors.phoneNumber && "text-red-600"
                    }`}
                  >
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.phoneNumber
                          ? "border-red-600"
                          : "border-zinc-800"
                      }   h-14 w-full text-xl font-base transition-all duration-800 rounded-xl`}
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
                  <FormMessage className="ml-2 text-xl text-red-600">
                    {form.formState.errors.phoneNumber?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full items-start">
                  <FormLabel
                    className={`text-xl font-medium ml-2 ${
                      form.formState.errors.email && "text-red-600"
                    }`}
                  >
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.email
                          ? "border-red-600"
                          : "border-zinc-800"
                      }   h-14 w-full text-xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Email"
                      onBlur={async () => {
                        await form.trigger("email");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-xl text-red-600">
                    {form.formState.errors.email?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full items-start">
                  <FormLabel
                    className={`text-xl font-medium ml-2 ${
                      form.formState.errors.password && "text-red-600"
                    }`}
                  >
                    Senha
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      className={`border-[1.5px] ${
                        form.formState.errors.password
                          ? "border-red-600"
                          : "border-zinc-800"
                      }   h-14 w-full text-xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Senha"
                      onBlur={async () => {
                        await form.trigger("password");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-xl text-red-600">
                    {form.formState.errors.password?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerFullName"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full items-start">
                  <FormLabel
                    className={`text-xl font-medium ml-2 ${
                      form.formState.errors.ownerFullName && "text-red-600"
                    }`}
                  >
                    Nome do proprietário
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.ownerFullName
                          ? "border-red-600"
                          : "border-zinc-800"
                      }   h-14 w-full text-xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Nome do proprietário"
                      onBlur={async () => {
                        await form.trigger("ownerFullName");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-xl text-red-600">
                    {form.formState.errors.ownerFullName?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full items-start">
                  <FormLabel
                    className={`text-xl font-medium ml-2 ${
                      form.formState.errors.document && "text-red-600"
                    }`}
                  >
                    Documento
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.document
                          ? "border-red-600"
                          : "border-zinc-800"
                      }   h-14 w-full text-xl font-base transition-all duration-800 rounded-xl`}
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
                  <FormMessage className="ml-2 text-xl text-red-600">
                    {form.formState.errors.document?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-center">
            <Button
              type="submit"
              className=" bg-button hover:bg-button-solid hover:text-background rounded-xl text-foreground h-16 w-[90%] text-3xl font-bold transition-all duration-900"
              disabled={!form.formState.isValid || loading}
            >
              {loading ? (
                <Image
                  src={LoadingSpin}
                  alt="Loading"
                  className="h-12 w-12 animate-spin"
                />
              ) : (
                "Cadastrar"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}