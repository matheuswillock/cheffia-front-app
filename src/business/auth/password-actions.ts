"use server"

import { passwordResetSchema } from "@/business/auth/validation"
import { createClient } from "@/utils/supabase/server"

export async function updatePassword(formData: FormData): Promise<
  { success: true } | { success: false; error: "invalid-password" | "invalid-or-expired-link" }
> {
  const parsed = passwordResetSchema.safeParse({
    password: String(formData.get("password") || ""),
    confirmPassword: String(formData.get("confirmPassword") || ""),
  })
  if (!parsed.success) return { success: false, error: "invalid-password" }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
    if (error) return { success: false, error: "invalid-or-expired-link" }
    return { success: true }
  } catch {
    return { success: false, error: "invalid-or-expired-link" }
  }
}
