import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

export default function RestaurantPage() {
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
    try {
      const response = await handleRegisterRestaurant(data);
      console.log("Restaurant registered successfully:", response);
    } catch (error) {
      console.error("Failed to register restaurant:", error);
    }
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
              control={form.control}
              name="document"
              className="flex flex-col w-full my-11"
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
