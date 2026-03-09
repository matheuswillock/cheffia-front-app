import { ResendConfirmationForm } from "@/components/ResendConfirmationContent/ResendConfirmationForm";

export default function ResendConfirmationPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background-default-default p-6 md:p-10">
      <div className="w-full max-w-md">
        <ResendConfirmationForm />
      </div>
    </div>
  );
}
