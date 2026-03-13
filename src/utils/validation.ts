import { z } from "zod";

const profileNameRegex = /^[\p{L}\s'-]+$/u;

const userProfileFormBaseSchema = z.object({
  fullName: z.string().min(3, "O nome completo deve ter no mínimo 3 caracteres")
    .max(120, "O nome completo deve ter no máximo 120 caracteres")
    .regex(profileNameRegex, "O nome completo deve conter apenas letras"),
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "A data de nascimento deve estar no formato AAAA-MM-DD"),
  document: z.string()
    .min(14, "O documento deve ter 11 dígitos (CPF)")
    .max(14, "O documento deve ter 11 dígitos (CPF)"),
  role: z.string().min(2, "A role deve ter no mínimo 2 caracteres")
    .max(80, "A role deve ter no máximo 80 caracteres"),
  jobTitle: z.string().min(2, "O cargo deve ter no mínimo 2 caracteres")
    .max(120, "O cargo deve ter no máximo 120 caracteres"),
  department: z.string().min(2, "O setor deve ter no mínimo 2 caracteres")
    .max(120, "O setor deve ter no máximo 120 caracteres"),
});

const validateUserProfileData = (
  data: z.infer<typeof userProfileFormBaseSchema>,
  ctx: z.RefinementCtx
) => {
  const documentDigits = data.document.replace(/\D/g, "");

  if (documentDigits.length !== 11) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["document"],
      message: "O documento do usuário deve ser um CPF com 11 dígitos",
    });
  }

  const birthDate = new Date(`${data.birthDate}T00:00:00.000Z`);

  if (Number.isNaN(birthDate.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["birthDate"],
      message: "A data de nascimento é inválida",
    });
    return;
  }

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  if (birthDate.getTime() > todayUtc) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["birthDate"],
      message: "A data de nascimento não pode estar no futuro",
    });
  }
};

export const userProfileFormSchema = userProfileFormBaseSchema.superRefine(validateUserProfileData);

export const signUpFormSchema = z.object({
  email: z.string().email("Digite um email válido").min(1, "O email é obrigatório"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caracter especial"),
  confirmPassword: z.string()
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "As senhas não conferem",
    });
  }
});

export const RegisterRestaurantFormSchema = z.object({
  name: z.string().min(3, "O nome do restaurante deve ter no mínimo 3 caracteres"),
  address: z.string().min(4, "A rua/avenida deve ter no mínimo 4 caracteres"),
  addressNumber: z.string().min(1, "O número do endereço é obrigatório"),
  complement: z.string().optional(),
  province: z.string().min(2, "O bairro deve ter no mínimo 2 caracteres"),
  postalCode: z.string().regex(/^\d{5}-\d{3}$/, "Insira um CEP válido"),
  phoneNumber: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Insira um número de telefone válido"),
  providerAvatarUrl: z.string().optional(),
  email: z.string().email("Digite um email válido").min(1, "O email é obrigatório"),
  emailVerified: z.boolean(),
  supabaseId: z.string().uuid("O ID do usuário é obrigatório"),
  ownerFullName: z.string().min(3, "O nome do proprietário deve ter no mínimo 2 caracteres")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/, "O nome deve conter apenas letras"),
  document: z.string().min(11, "O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)")
    .max(18, "O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)"),
  birthDate: z.string().optional(),
  companyType: z.string().optional(),
}).superRefine((data, ctx) => {
  const documentDigits = data.document.replace(/\D/g, "");

  if (![11, 14].includes(documentDigits.length)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["document"],
      message: "O documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)",
    });
    return;
  }

  if (documentDigits.length === 11 && !data.birthDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["birthDate"],
      message: "A data de nascimento é obrigatória para CPF",
    });
  }

  if (documentDigits.length === 14 && !data.companyType?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["companyType"],
      message: "O tipo da empresa é obrigatório para CNPJ",
    });
  }
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

