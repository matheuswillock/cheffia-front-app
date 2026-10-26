import { z } from "zod"

export const authFormSchema = (isSignUp: boolean) =>
  z.object({
    email: z.string().trim().min(1, "O email é obrigatório").email("Digite um email válido"),
    password: z.string().min(1, "A senha é obrigatória"),
    confirmPassword: z.string(),
  }).superRefine(({ password, confirmPassword }, context) => {
    if (!isSignUp) return

    if (password.length < 8) {
      context.addIssue({ code: "custom", path: ["password"], message: "A senha deve ter no mínimo 8 caracteres" })
    }
    if (!/[A-Z]/.test(password)) {
      context.addIssue({ code: "custom", path: ["password"], message: "A senha deve conter pelo menos uma letra maiúscula" })
    }
    if (!/[a-z]/.test(password)) {
      context.addIssue({ code: "custom", path: ["password"], message: "A senha deve conter pelo menos uma letra minúscula" })
    }
    if (!/[0-9]/.test(password)) {
      context.addIssue({ code: "custom", path: ["password"], message: "A senha deve conter pelo menos um número" })
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      context.addIssue({ code: "custom", path: ["password"], message: "A senha deve conter pelo menos um caracter especial" })
    }
    if (password !== confirmPassword) {
      context.addIssue({ code: "custom", path: ["confirmPassword"], message: "As senhas não conferem" })
    }
  })

export const authRecoverySchema = z.object({
  email: z.string().trim().min(1, "O email é obrigatório").email("Digite um email válido"),
  password: z.string(),
  confirmPassword: z.string(),
})

export const passwordResetSchema = z.object({
  password: z.string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caracter especial"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
})

export type AuthFormValues = z.infer<ReturnType<typeof authFormSchema>>
