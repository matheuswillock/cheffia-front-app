import { z } from "zod";

export const formSchema = z.object({
  name: z.string().min(3, "O nome do restaurante deve ter no mínimo 3 caracteres"),
  address: z.string().min(4, "O endereço deve ter no mínimo 4 caracteres"),
  phoneNumber: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Insira um número de telefone válido"),
  email: z.string().email("Digite um email válido").min(1, "O email é obrigatório"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caracter especial"),
  ownerFullName: z.string().min(3, "O nome do proprietário deve ter no mínimo 2 caracteres")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "O nome deve conter apenas letras"),
  document: z.string().min(11, "O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)")
    .max(18, "O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)"),
});

export const AddMenuItemSchema = z.object({
  name: z.string().min(3, "O nome do item deve ter no mínimo 3 caracteres"),
  description: z.string().min(3, "A descrição do item deve ter no mínimo 3 caracteres"),
  price: z.number().min(0.01, "O preço do item deve ser maior que 0"),
  ingredients: z.array(
    z.string().min(3, "Cada ingrediente deve ter no mínimo 3 caracteres")
  ).min(1, "A lista de ingredientes não pode ser vazia"),
  itemMedia: z.instanceof(File).refine(file => file instanceof File, {
    message: "Insira um arquivo de mídia válido para o item"
  }),
  restaurantId: z.string().uuid("O ID do restaurante é obrigatório")
});