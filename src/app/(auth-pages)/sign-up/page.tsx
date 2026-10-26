"use client"

import { AuthForm } from "@/components/AuthContent/AuthForm"
import { requestPasswordRecovery, signIn, signUp } from "@/business/auth/actions"

export default function SignUpPage() {
  return <AuthForm
    initialMode="sign-up"
    onSignIn={async (credentials) => {
      const result = await signIn(toFormData(credentials))
      if (!result.success) throw result
    }}
    onSignUp={(credentials) => signUp(toFormData(credentials))}
    onRequestPasswordReset={async (email) => {
      const result = await requestPasswordRecovery(toEmailFormData(email))
      if (!result.success) throw result
    }}
  />
}

function toEmailFormData(email: string) {
  const formData = new FormData()
  formData.set("email", email)
  return formData
}

function toFormData(credentials: { email: string; password: string }) {
  const formData = new FormData()
  formData.set("email", credentials.email)
  formData.set("password", credentials.password)
  return formData
}
