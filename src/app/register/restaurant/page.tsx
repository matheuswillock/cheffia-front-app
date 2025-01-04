"use client"

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  restaurantName: z
    .string()
    .min(3, "O nome do restaurante deve ter no mínimo 3 caracteres"),

  address: z
    .string()
    .min(4, "O endereço deve ter no mínimo 4 caracteres"),

  phoneNumber: z
    .string()
    .length(11, "O telefone deve ter exatamente 11 dígitos")
    .regex(/^\d+$/, "O telefone deve conter apenas números"),

  email: z
    .string()
    .email("Digite um email válido")
    .min(1, "O email é obrigatório"),

  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número"),

  ownerFullName: z
    .string()
    .min(3, "O nome do proprietário deve ter no mínimo 2 caracteres")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "O nome deve conter apenas letras"),

  document: z
    .string()
    .regex(
      /^\d{11}$|^\d{14}$/,
      "Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido"
    ),
});

type FormData = z.infer<typeof formSchema>;

export default function RestaurantPage() {
  const [inputName, setInputName] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

    const onSubmit = (data: FormData) => {
      console.log(data);
      // Aqui você pode implementar a lógica de envio dos dados
    };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-[810px] gap-6 my-32 mx-auto"
    >
      <div className="w-full gap-6 my-32 mx-auto">
        <div>
          <h2 className="text-5xl font-semibold ml-1">
            Cadastre o seu restaurante
          </h2>
        </div>

        <div className="flex flex-col w-full gap-8 my-11">
          <div className="flex flex-col w-full gap-2 items-start">
            <Label
              htmlFor="restaurantName"
              className="text-2xl font-medium ml-4"
            >
              Nome do restaurante
            </Label>
            <Input
              {...register("restaurantName")}
              id="restaurantName"
              type="text"
              value={inputName}
              onChange={(value) => {
                console.log(value)
                setInputName(value);
              }}
              className="border-[1.5px] border-zinc-800 focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl"
            />
            {errors.restaurantName && (
              <span className="text-red-500 ml-4">
                {errors.restaurantName.message}
              </span>
            )}
          </div>

          <div className="items-start flex flex-col w-full gap-2">
            <Label htmlFor="address" className="text-2xl font-medium ml-4">
              Endereço
            </Label>
            <Input
              {...register("address")}
              id="address"
              type="text"
              className="border-[1.5px] border-zinc-800 focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl"
            />
            {errors.address && (
              <span className="text-red-500 ml-4">
                {errors.address.message}
              </span>
            )}
          </div>

          <div className="flex items-start flex-col w-full gap-2">
            <Label
              htmlFor="ownerFullName"
              className="text-2xl font-medium ml-4"
            >
              Nome completo do proprietário
            </Label>
            <Input
              {...register("restaurantName", {
                onBlur: () => trigger("restaurantName"),
              })}
              id="ownerFullName"
              type="text"
              className="border-[1.5px] border-zinc-800 focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl"
            />
            {errors.ownerFullName && (
              <span className="text-red-500 ml-4">
                {errors.ownerFullName.message}
              </span>
            )}
          </div>

          <div className="flex items-start flex-col w-full gap-2">
            <Label htmlFor="phoneNumber" className="text-2xl font-medium ml-4">
              Telefone
            </Label>
            <Input
              {...register("phoneNumber")}
              id="phoneNumber"
              type="text"
              placeholder="(11) 9999-9999"
              className="border-[1.5px] border-zinc-800 focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl"
            />
            {errors.phoneNumber && (
              <span className="text-red-500 ml-4">
                {errors.phoneNumber.message}
              </span>
            )}
          </div>

          <div className="flex items-start flex-col w-full gap-2">
            <Label htmlFor="document" className="text-2xl font-medium ml-4">
              Documento
            </Label>
            <Input
              {...register("document")}
              id="document"
              type="text"
              placeholder="CPF OU CNPJ"
              className="border-[1.5px] border-zinc-800 focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl"
            />
            {errors.document && (
              <span className="text-red-500 ml-4">
                {errors.document.message}
              </span>
            )}
          </div>

          <div className=" items-start flex flex-col w-full gap-2">
            <Label htmlFor="email" className="text-2xl font-medium ml-4">
              Email
            </Label>
            <Input
              {...register("email")}
              id="email"
              type="email"
              placeholder="johndoe@email.com"
              className="border-[1.5px] border-zinc-800 focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl"
            />
            {errors.email && (
              <span className="text-red-500 ml-4">{errors.email.message}</span>
            )}
          </div>

          <div className="flex items-start flex-col w-full gap-2">
            <Label htmlFor="password" className="text-2xl font-medium ml-4">
              Senha
            </Label>
            <Input
              {...register("password")}
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres, com letra maiúscula, minúscula, número e caracter especial"
              className="border-[1.5px] border-zinc-800 focus:border-defaultForeground focus:border-2 h-20 w-full text-3xl font-base transition-all duration-800 rounded-xl"
            />
            {errors.password && (
              <span className="text-red-500 ml-4">
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="flex flex-row justify-end min-h-28 gap-2 w-full ">
            <Button
              type="button"
              variant="ghost"
              className=" border-none  h-20 w-56 text-4xl hover:bg-defaultButtonDarkBakground font-semibold transition-all duration-800"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              className="bg-defaultButtonBackgroung hover:bg-defaultButtonDarkBakground text-defaultButtonColor h-20 w-56 text-4xl font-semibold transition-all duration-800"
            >
              Cadastrar
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
