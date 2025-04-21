"use client"
import { SignInForm } from "@/components/SignInContent/SignInForm";
import { signIn, signInActionWithProvider } from "@/business/auth/actions";

export default function SignInPage() {

  const handleSignIn = async (formData: FormData) => {
    await signIn(formData);
  };

  const handleGoogleSignIn = async () => {
    await signInActionWithProvider();
  };

  return (
    <div className="flex min-h-svh flex-col items-center bg-background-default-default justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <SignInForm
          onSignIn={handleSignIn} 
          googleSignIn={handleGoogleSignIn}
        />
      </div>
    </div>
  );
}