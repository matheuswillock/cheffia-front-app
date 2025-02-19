"use client";

import { signInAction, signInActionWithProvider } from "@/business/auth/actions";
import { SignInForm } from "@/components/SignInForm";

export default function SignInPage() {

  const handleSignIn = async (formData: FormData) => {
    await signInAction(formData);
  };

  const handleGoogleSignIn = async () => {
    await signInActionWithProvider();
  };

  return (
    <div className="flex min-h-svh flex-col items-center bg-background justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <SignInForm 
          onSignIn={handleSignIn} 
          googleSignIn={handleGoogleSignIn}
        />
      </div>
    </div>
  );
}