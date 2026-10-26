import { updatePassword } from "@/business/auth/password-actions"
import { PasswordResetForm } from "@/components/AuthContent/PasswordResetForm"

export default function ResetPasswordPage() {
  return <PasswordResetForm onPasswordUpdate={updatePassword} />
}
