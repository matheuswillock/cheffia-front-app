"use client";

import { completeRestaurantOnboarding, signUpActionWithProvider } from "@/app/actions/auth";
import { SignUpForm } from "@/components/SignUpContent/SignUpForm";

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background-default p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <SignUpForm
          onCompleteOnboarding={completeRestaurantOnboarding}
          googleSignUp={signUpActionWithProvider}
        />
      </div>
    </div>
  );
}
