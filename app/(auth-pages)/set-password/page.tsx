import { SetPasswordForm } from "@/components/SetPasswordContent/SetPasswordForm";

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background-default p-6 md:p-10">
      <div className="w-full max-w-md">
        <SetPasswordForm />
      </div>
    </div>
  );
}

