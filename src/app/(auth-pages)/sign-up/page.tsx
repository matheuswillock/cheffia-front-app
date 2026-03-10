"use client"
import { SignUpForm } from "@/components/SignUpContent/SignUpForm";
import { signUp, signUpActionWithProvider } from "@/business/auth/actions";

export default function SignUpPage()  {
  const handleSignUp = async (formData: FormData) => {
    await signUp(formData);
  };

  const handleGoogleSignUp = async () => {
    await signUpActionWithProvider();
  };

  return (
    <div className="flex min-h-svh flex-col items-center bg-background-default justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <SignUpForm 
          onSignUp={handleSignUp} 
          googleSignUp={handleGoogleSignUp}
        />
      </div>
    </div>
  );
};

