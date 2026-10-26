import { expect, test } from "bun:test"

import { authFormSchema, authRecoverySchema, passwordResetSchema } from "@/business/auth/validation"

test("validates the sign-in form without applying sign-up password rules", () => {
  expect(authFormSchema(false).safeParse({
    email: " person@example.com ",
    password: "short",
    confirmPassword: "different",
  }).success).toBe(true)
})

test("reports every sign-up password requirement and password mismatch", () => {
  const result = authFormSchema(true).safeParse({
    email: "person@example.com",
    password: "",
    confirmPassword: "different",
  })

  expect(result.success).toBe(false)
  if (result.success) return
  const messages = result.error.issues.map((issue) => issue.message)
  expect(messages).toContain("A senha deve ter no mínimo 8 caracteres")
  expect(messages).toContain("A senha deve conter pelo menos uma letra maiúscula")
  expect(messages).toContain("A senha deve conter pelo menos uma letra minúscula")
  expect(messages).toContain("A senha deve conter pelo menos um número")
  expect(messages).toContain("A senha deve conter pelo menos um caracter especial")
  expect(messages).toContain("As senhas não conferem")
})

test("accepts valid recovery and password reset payloads", () => {
  expect(authRecoverySchema.safeParse({ email: "person@example.com", password: "", confirmPassword: "" }).success).toBe(true)
  expect(passwordResetSchema.safeParse({ password: "SenhaSegura1!", confirmPassword: "SenhaSegura1!" }).success).toBe(true)
})
