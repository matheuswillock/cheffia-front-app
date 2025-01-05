"use client"
import { Alert } from "@nextui-org/alert";
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

export default function RestaurantForm() {
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      console.error("Failed to register restaurant:", error);
    }
    setLoading(false);
  };

  return (
    <>
      {/* <div className="flex items-center justify-center w-full my-4">
        <Alert
          color="success"
          description={description}
          isVisible={true}
          title={title}
          variant="solid"
          // onClose={() => setIsVisible(false)}
        />
      </div> */}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col w-full gap-8 mt-20 mb-16 mx-auto">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel
                    className={`text-3xl font-medium ml-2 ${form.formState.errors.name && "text-red-600"}`}
                  >
                    Nome do restaurante
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.name
                          ? "border-red-600 border-2"
                          : "border-zinc-800"
                      } h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Nome do restaurante"
                      onBlur={async () => {
                        await form.trigger("name");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-2xl text-red-600">
                    {form.formState.errors.name?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className={`text-3xl font-medium ml-2 ${form.formState.errors.address && "text-red-600"}`}>	
                    Endereço
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.address
                          ? "border-red-600 border-2"
                          : "border-zinc-800"
                      }   h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Endereço"
                      onBlur={async () => {
                        await form.trigger("address");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-2xl text-red-600">
                    {form.formState.errors.address?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className={`text-3xl font-medium ml-2 ${form.formState.errors.phoneNumber && "text-red-600"}`}>
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.phoneNumber
                          ? "border-red-600 border-2"
                          : "border-zinc-800"
                      }   h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
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
                  <FormMessage className="ml-2 text-2xl text-red-600">
                    {form.formState.errors.phoneNumber?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className={`text-3xl font-medium ml-2 ${form.formState.errors.email && "text-red-600"}`}>
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.email
                          ? "border-red-600 border-2"
                          : "border-zinc-800"
                      }   h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Email"
                      onBlur={async () => {
                        await form.trigger("email");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-2xl text-red-600">
                    {form.formState.errors.email?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className={`text-3xl font-medium ml-2 ${form.formState.errors.password && "text-red-600"}`}>
                    Senha
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      className={`border-[1.5px] ${
                        form.formState.errors.password
                          ? "border-red-600 border-2"
                          : "border-zinc-800"
                      }   h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Senha"
                      onBlur={async () => {
                        await form.trigger("password");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-2xl text-red-600">
                    {form.formState.errors.password?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerFullName"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className={`text-3xl font-medium ml-2 ${form.formState.errors.ownerFullName && "text-red-600"}`}>
                    Nome do proprietário
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.ownerFullName
                          ? "border-red-600 border-2"
                          : "border-zinc-800"
                      }   h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
                      placeholder="Nome do proprietário"
                      onBlur={async () => {
                        await form.trigger("ownerFullName");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="ml-2 text-2xl text-red-600">
                    {form.formState.errors.ownerFullName?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full gap-2 items-start">
                  <FormLabel className={`text-3xl font-medium ml-2 ${form.formState.errors.document && "text-red-600"}`}>
                    Documento
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border-[1.5px] ${
                        form.formState.errors.document
                          ? "border-red-600 border-2"
                          : "border-zinc-800"
                      }   h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl`}
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
                  <FormMessage className="ml-2 text-2xl text-red-600">
                    {form.formState.errors.document?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-center">
            <Button
              type="submit"
              className=" bg-button hover:bg-button-solid hover:text-background rounded-xl text-foreground h-20 w-[90%] text-3xl font-bold transition-all duration-900"
              disabled={!form.formState.isValid || loading}
            >
              {loading ? (
                <Image
                  src={LoadingSpin}
                  alt="Loading"
                  className="h-14 w-14 animate-spin"
                />
              ) : (
                "Cadastrar"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}