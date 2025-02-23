"use client"
import { SignUpForm } from "@/components/SignUpContent/SignUpForm";
import { signInActionWithProvider, signUp } from "@/services/auth/actions";

export default function SignUpPage()  {
  const handleSignUp = async (formData: FormData) => {
    await signUp(formData);
  };

  const handleGoogleSignIn = async () => {
    await signInActionWithProvider();
  };

  return (
    <div className="flex min-h-svh flex-col items-center bg-background justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <SignUpForm 
          onSignUp={handleSignUp} 
          googleSignIn={handleGoogleSignIn}
        />
      </div>
    </div>
  );
};
