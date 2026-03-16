"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { createEmailConfirmationLink, getEmailService } from "@/app/api/useCases/email";
import { RestaurantService } from "@/app/api/useCases/restaurant";
import { UserProfileService } from "@/app/api/useCases/userProfiles";

async function getSupabaseClient() {
  return await createClient();
}

const readStringFormField = (formData: FormData, key: string): string =>
  String(formData.get(key) ?? "").trim();

const normalizeRelativePath = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return null;
  }
  return normalized;
};

const isValidCnpj = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calculateCheckDigit = (base: string, weights: number[]): number => {
    const sum = base
      .split("")
      .reduce((accumulator, digit, index) => accumulator + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base = digits.slice(0, 12);
  const firstDigit = calculateCheckDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateCheckDigit(`${base}${firstDigit}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return digits === `${base}${firstDigit}${secondDigit}`;
};

const onboardingInputSchema = z
  .object({
    authMethod: z.enum(["password", "google"]),
    restaurant: z.object({
      name: z.string().trim().min(3, "Nome do restaurante invalido"),
      email: z.string().trim().email("Email do restaurante invalido"),
      document: z.string().trim().min(14, "CNPJ do restaurante invalido"),
      phoneNumber: z.string().trim().min(10, "Telefone do restaurante invalido"),
      postalCode: z.string().trim().min(8, "CEP invalido"),
      address: z.string().trim().min(4, "Endereco invalido"),
      addressNumber: z.string().trim().min(1, "Numero do endereco invalido"),
      province: z.string().trim().min(2, "Bairro invalido"),
      complement: z.string().trim().optional(),
      city: z.string().trim().min(2, "Cidade invalida"),
      state: z.string().trim().min(2, "Estado invalido"),
    }),
    owner: z.object({
      fullName: z.string().trim().min(3, "Nome do owner invalido"),
      birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento invalida"),
      document: z.string().trim().min(11, "Documento do owner invalido"),
    }),
    auth: z
      .object({
        password: z
          .string()
          .min(8, "A senha deve ter no minimo 8 caracteres")
          .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiuscula")
          .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minuscula")
          .regex(/[0-9]/, "A senha deve conter pelo menos um numero")
          .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caracter especial"),
        confirmPassword: z.string(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const restaurantDocumentDigits = data.restaurant.document.replace(/\D/g, "");
    if (restaurantDocumentDigits.length !== 14) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["restaurant", "document"],
        message: "O documento do restaurante deve ser um CNPJ com 14 digitos",
      });
    }

    if (!isValidCnpj(data.restaurant.document)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["restaurant", "document"],
        message: "CNPJ do restaurante invalido",
      });
    }

    const ownerDocumentDigits = data.owner.document.replace(/\D/g, "");
    if (ownerDocumentDigits.length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["owner", "document"],
        message: "O documento do owner deve ser um CPF com 11 digitos",
      });
    }

    if (data.authMethod === "password") {
      if (!data.auth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["auth"],
          message: "Senha e confirmacao de senha sao obrigatorias",
        });
        return;
      }

      if (data.auth.password !== data.auth.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["auth", "confirmPassword"],
          message: "As senhas nao conferem",
        });
      }
    }
  });

export interface CompleteRestaurantOnboardingInput {
  authMethod: "password" | "google";
  restaurant: {
    name: string;
    email: string;
    document: string;
    phoneNumber: string;
    postalCode: string;
    address: string;
    addressNumber: string;
    province: string;
    complement?: string;
    city: string;
    state: string;
  };
  owner: {
    fullName: string;
    birthDate: string;
    document: string;
  };
  auth?: {
    password: string;
    confirmPassword: string;
  };
}

interface CompleteRestaurantOnboardingResult {
  redirectTo: string;
  portalName: string;
  usedGoogleEmail: boolean;
}

export interface CompleteRestaurantOnboardingResponse {
  isValid: boolean;
  successMessages: string[];
  errorMessages: string[];
  result: CompleteRestaurantOnboardingResult | null;
}

const failOnboarding = (
  errorMessages: string | string[]
): CompleteRestaurantOnboardingResponse => ({
  isValid: false,
  successMessages: [],
  errorMessages: Array.isArray(errorMessages) ? errorMessages : [errorMessages],
  result: null,
});

const okOnboarding = (
  result: CompleteRestaurantOnboardingResult
): CompleteRestaurantOnboardingResponse => ({
  isValid: true,
  successMessages: ["Cadastro concluido com sucesso"],
  errorMessages: [],
  result,
});

const sendSignUpConfirmationEmail = async ({
  email,
  fullName,
  supabaseUserId,
  appBaseUrl,
}: {
  email: string;
  fullName: string;
  supabaseUserId: string;
  appBaseUrl?: string | null;
}): Promise<void> => {
  try {
    const link = await createEmailConfirmationLink({
      email,
      nextPath: "/register/restaurant",
      appBaseUrl,
    });

    const delivery = await getEmailService().sendEmailConfirmationEmail(
      {
        userName: fullName,
        userEmail: email,
        confirmationUrl: link.deliveryUrl,
      },
      { supabaseUserId }
    );

    if (!delivery.success) {
      console.error("auth.sign_up.confirmation_email_failed", {
        supabaseUserId,
        message: delivery.error,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown confirmation email error";
    console.error("auth.sign_up.confirmation_email_failed", {
      supabaseUserId,
      message,
    });
  }
};

const buildUserProfileInputFromForm = (
  formData: FormData,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }
) => ({
  supabaseUserId: user.id,
  email: user.email ?? readStringFormField(formData, "email"),
  fullName: readStringFormField(formData, "fullName"),
  birthDate: readStringFormField(formData, "birthDate"),
  document: readStringFormField(formData, "document"),
  role: "master" as const,
  avatarUrl:
    typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
});

const authenticateWithOAuth = async (nextPath?: string) => {
  const supabase = await getSupabaseClient();
  const origin =
    (await headers()).get("origin")?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";

  const redirectTo = new URL("/auth/callback", origin);
  const normalizedNextPath = normalizeRelativePath(nextPath);
  if (normalizedNextPath) {
    redirectTo.searchParams.set("next", normalizedNextPath);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Erro no authenticateWithOAuth", error.message);
    return redirect("/sign-in");
  }

  return data;
};

export async function signIn(formData: FormData) {
  try {
    const supabase = await getSupabaseClient();
    const profileService = new UserProfileService();

    const credentials = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error || !data.user) {
      redirect("/error");
    }

    revalidatePath("/", "layout");
    redirect(await profileService.resolvePostAuthDestination(data.user.id));
  } catch (error) {
    console.error("signIn | error:", error);
    redirect("/error");
  }
}

export async function signUp(formData: FormData) {
  const supabase = await getSupabaseClient();
  const requestHeaders = await headers();
  const appBaseUrl = requestHeaders.get("origin");

  const credentials = {
    email: readStringFormField(formData, "email"),
    password: readStringFormField(formData, "password"),
  };

  const { error, data } = await supabase.auth.signUp({
    ...credentials,
  });

  if (error || !data.user) {
    redirect("/error");
  }

  if (!data.user.email_confirmed_at) {
    await sendSignUpConfirmationEmail({
      email: credentials.email,
      fullName: credentials.email,
      supabaseUserId: data.user.id,
      appBaseUrl,
    });
  }

  revalidatePath("/", "layout");
  redirect("/register/restaurant");
}

export async function completeUserProfile(formData: FormData) {
  const supabase = await getSupabaseClient();
  const profileService = new UserProfileService();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      isValid: false,
      successMessages: [],
      errorMessages: ["Usuario autenticado nao encontrado"],
      result: null,
    };
  }

  const output = await profileService.upsert(
    buildUserProfileInputFromForm(formData, {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    })
  );

  if (output.isValid) {
    revalidatePath("/", "layout");
  }

  return output;
}

export async function completeRestaurantOnboarding(
  input: CompleteRestaurantOnboardingInput
): Promise<CompleteRestaurantOnboardingResponse> {
  const parsed = onboardingInputSchema.safeParse(input);
  if (!parsed.success) {
    return failOnboarding(parsed.error.issues.map((issue) => issue.message));
  }

  const supabase = await getSupabaseClient();
  const requestHeaders = await headers();
  const appBaseUrl = requestHeaders.get("origin");
  const profileService = new UserProfileService();
  const restaurantService = new RestaurantService();

  const normalizedRestaurant = {
    ...parsed.data.restaurant,
    email: parsed.data.restaurant.email.trim().toLowerCase(),
    document: parsed.data.restaurant.document.replace(/\D/g, ""),
    phoneNumber: parsed.data.restaurant.phoneNumber.replace(/\D/g, ""),
    postalCode: parsed.data.restaurant.postalCode.replace(/\D/g, ""),
    state: parsed.data.restaurant.state.trim().toUpperCase(),
    complement: parsed.data.restaurant.complement?.trim() ?? "",
  };
  const normalizedOwner = {
    ...parsed.data.owner,
    document: parsed.data.owner.document.replace(/\D/g, ""),
  };

  let user:
    | {
        id: string;
        email?: string | null;
        email_confirmed_at?: string | null;
        user_metadata?: Record<string, unknown>;
      }
    | null = null;

  if (parsed.data.authMethod === "password") {
    const password = parsed.data.auth?.password;
    if (!password) {
      return failOnboarding("Senha obrigatoria para cadastro com email e senha");
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedRestaurant.email,
      password,
    });

    if (error || !data.user) {
      return failOnboarding(error?.message ?? "Nao foi possivel criar o usuario");
    }

    user = data.user;

    if (!data.user.email_confirmed_at) {
      await sendSignUpConfirmationEmail({
        email: normalizedRestaurant.email,
        fullName: normalizedOwner.fullName,
        supabaseUserId: data.user.id,
        appBaseUrl,
      });
    }
  } else {
    const {
      data: { user: oauthUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !oauthUser) {
      return failOnboarding("Usuario Google nao autenticado. Refaça a autenticacao.");
    }

    user = oauthUser;
  }

  if (!user) {
    return failOnboarding("Usuario autenticado nao encontrado");
  }

  const resolvedEmail = (user.email ?? normalizedRestaurant.email).trim().toLowerCase();
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  const usedGoogleEmail =
    parsed.data.authMethod === "google" && resolvedEmail !== normalizedRestaurant.email;

  const profileOutput = await profileService.upsert({
    supabaseUserId: user.id,
    email: resolvedEmail,
    fullName: normalizedOwner.fullName,
    birthDate: normalizedOwner.birthDate,
    document: normalizedOwner.document,
    role: "master",
    avatarUrl,
  });

  if (!profileOutput.isValid) {
    return failOnboarding(profileOutput.errorMessages);
  }

  const restaurantOutput = await restaurantService.register(
    {
      name: normalizedRestaurant.name,
      address: normalizedRestaurant.address,
      addressNumber: normalizedRestaurant.addressNumber,
      complement: normalizedRestaurant.complement,
      province: normalizedRestaurant.province,
      city: normalizedRestaurant.city,
      state: normalizedRestaurant.state,
      postalCode: normalizedRestaurant.postalCode,
      phoneNumber: normalizedRestaurant.phoneNumber,
      email: resolvedEmail,
      emailVerified: Boolean(user.email_confirmed_at),
      supabaseId: user.id,
      ownerFullName: normalizedOwner.fullName,
      document: normalizedRestaurant.document,
      birthDate: normalizedOwner.birthDate,
      companyType: null,
      providerAvatarUrl: avatarUrl ?? "",
    },
    null,
    { appBaseUrl }
  );

  if (!restaurantOutput.isValid) {
    return failOnboarding(restaurantOutput.errorMessages);
  }

  let redirectTo = "/sign-in";
  if (parsed.data.authMethod === "google") {
    redirectTo = await profileService.resolvePostAuthDestination(user.id);
  } else {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id === user.id) {
      redirectTo = await profileService.resolvePostAuthDestination(user.id);
    }
  }

  revalidatePath("/", "layout");
  return okOnboarding({
    redirectTo,
    portalName: "Portal Cheffia",
    usedGoogleEmail,
  });
}

export const signInActionWithProvider = async () => {
  const data = await authenticateWithOAuth();

  if (data.url) {
    return redirect(data.url);
  }

  return redirect("/dashboard");
};

export const signUpActionWithProvider = async (nextPath = "/sign-up?resume=google") => {
  const data = await authenticateWithOAuth(nextPath);

  if (data.url) {
    return redirect(data.url);
  }

  redirect("/register/restaurant");
};

