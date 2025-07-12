import { z } from "zod";

export const signUpFormSchema = z.object({
  email: z.string().email("Digite um email válido").min(1, "O email é obrigatório"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caracter especial"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

export const RegisterRestaurantFormSchema = z.object({
  name: z.string().min(3, "O nome do restaurante deve ter no mínimo 3 caracteres"),
  address: z.string().min(4, "O endereço deve ter no mínimo 4 caracteres"),
  phoneNumber: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Insira um número de telefone válido"),
  providerAvatarUrl: z.string().optional(),
  email: z.string().email("Digite um email válido").min(1, "O email é obrigatório"),
  emailVerified: z.boolean().default(false),
  supabaseId: z.string().uuid("O ID do usuário é obrigatório"),
  ownerFullName: z.string().min(3, "O nome do proprietário deve ter no mínimo 2 caracteres")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "O nome deve conter apenas letras"),
  document: z.string().min(11, "O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)")
    .max(18, "O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)")
});

export const AddMenuItemSchema = z.object({
  name: z.string().min(3, "O nome do item deve ter no mínimo 3 caracteres"),
  description: z.string().min(3, "A descrição do item deve ter no mínimo 3 caracteres"),
  price: z.number().min(0.01, "O preço do item deve ser maior que 0"),
  ingredients: z.array(
    z.string().min(3, "Cada ingrediente deve ter no mínimo 3 caracteres")
  ).min(1, "A lista de ingredientes não pode ser vazia"),
  category: z.string().nonempty("A categoria do item é obrigatória"),
  itemMedia: z.instanceof(File).refine(file => file instanceof File, {
    message: "Insira um arquivo de mídia válido para o item"
  }).optional(),
  restaurantId: z.string().uuid("O Id do restaurante é obrigatório")
});

export const AskAQuestionSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "O nome deve conter apenas letras"),
  email: z.string().email("Digite um email válido").min(1, "O email é obrigatório"),
  countryCode: z.string().regex(/^\+\d{1,3}$/, "Insira um código de país válido"),
  contact: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Insira um número de telefone válido"),
  message: z.string().min(10, "A mensagem deve ter no mínimo 10 caracteres")
    .max(500, "A mensagem deve ter no máximo 500 caracteres"),
});

export const JoinWaitlistSchema = z.object({
  restaurantName: z.string().min(3, "O nome do restaurante deve ter no mínimo 3 caracteres")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "O nome deve conter apenas letras"),
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "O nome deve conter apenas letras"),
  email: z.string().email("Digite um email válido").min(1, "O email é obrigatório"),
  countryCode: z.string().regex(/^\+\d{1,3}$/, "Insira um código de país válido"),
  restaurantContact: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Insira um número de telefone válido"),
  city: z.string().min(3, "O nome da cidade deve conter no mínimo 3 caracteres")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "A cidade deve conter apenas letras"),
  state: z.enum([
    "",
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ]),
  restaurantSize: z.enum([
    "",
    "Microempreendedor Individual (MEI)",
    "Microempresa (ME)",
    "Empresa de pequeno porte (EPP)",
    "Empresa de médio porte",
    "Empresa de grande porte",
    "Não se aplica"
  ]),
  ticketAverage: z.string().optional(),
  platformName: z.string().optional(),
});

