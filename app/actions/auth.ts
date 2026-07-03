"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseAdminClient } from "@/app/api/infra/supabase/adminClient";
import { createEmailConfirmationLink, getEmailService } from "@/app/api/useCases/email";
import { RestaurantService } from "@/app/api/useCases/restaurant";
import { UserProfileService } from "@/app/api/useCases/userProfiles";
import { resolveRequestIdFromHeaders } from "@/lib/server/requestId";

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
      companyType: z.string().trim().min(1, "Tipo da empresa obrigatorio"),
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
    companyType: string;
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
  requestId,
}: {
  email: string;
  fullName: string;
  supabaseUserId: string;
  appBaseUrl?: string | null;
  requestId?: string;
}): Promise<void> => {
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
    { supabaseUserId, requestId }
  );

  if (!delivery.success) {
    throw new Error(delivery.error ?? "Failed to send confirmation email");
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
  const requestHeaders = await headers();
  const requestId = resolveRequestIdFromHeaders(requestHeaders);
  const origin =
    requestHeaders.get("origin")?.trim() ||
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
    console.error("auth.oauth.authenticate_failed", {
      requestId,
      message: error.message,
    });
    return redirect("/sign-in");
  }

  return data;
};

export async function signIn(formData: FormData) {
  const requestHeaders = await headers();
  const requestId = resolveRequestIdFromHeaders(requestHeaders);
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
    const message = error instanceof Error ? error.message : "Unknown sign-in error";
    console.error("auth.sign_in.failed", {
      requestId,
      message,
    });
    redirect("/error");
  }
}

export async function signUp(formData: FormData) {
  const adminClient = getSupabaseAdminClient();
  const requestHeaders = await headers();
  const requestId = resolveRequestIdFromHeaders(requestHeaders);
  const appBaseUrl = requestHeaders.get("origin");
  const logInfo = (event: string, payload: Record<string, unknown> = {}) =>
    console.info(event, { requestId, ...payload });
  const logError = (event: string, payload: Record<string, unknown> = {}) =>
    console.error(event, { requestId, ...payload });

  const credentials = {
    email: readStringFormField(formData, "email"),
    password: readStringFormField(formData, "password"),
  };

  logInfo("auth.sign_up.started", {
    email: credentials.email,
    appBaseUrl,
  });

  const createdAuthUser = await adminClient.auth.admin.createUser({
    email: credentials.email,
    password: credentials.password,
    email_confirm: false,
  });

  if (createdAuthUser.error || !createdAuthUser.data.user) {
    logError("auth.sign_up.failed", {
      email: credentials.email,
      message: createdAuthUser.error?.message ?? "Nao foi possivel criar o usuario",
    });
    redirect("/error");
  }

  logInfo("auth.sign_up.succeeded", {
    email: credentials.email,
    supabaseUserId: createdAuthUser.data.user.id,
  });

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
  const requestHeaders = await headers();
  const requestId = resolveRequestIdFromHeaders(requestHeaders);
  const logInfo = (event: string, payload: Record<string, unknown> = {}) =>
    console.info(event, { requestId, ...payload });
  const logError = (event: string, payload: Record<string, unknown> = {}) =>
    console.error(event, { requestId, ...payload });

  logInfo("auth.complete_onboarding.started", {
    authMethod: input.authMethod,
    restaurantEmail: input.restaurant?.email ?? null,
  });

  if (!parsed.success) {
    logError("auth.complete_onboarding.validation_failed", {
      authMethod: input.authMethod,
      errors: parsed.error.issues.map((issue) => issue.message),
    });
    return failOnboarding(parsed.error.issues.map((issue) => issue.message));
  }

  const supabase = await getSupabaseClient();
  const appBaseUrl = requestHeaders.get("origin");
  const profileService = new UserProfileService();
  const restaurantService = new RestaurantService();

  const normalizedRestaurant = {
    ...parsed.data.restaurant,
    email: parsed.data.restaurant.email.trim().toLowerCase(),
    document: parsed.data.restaurant.document.replace(/\D/g, ""),
    companyType: parsed.data.restaurant.companyType.trim().toUpperCase(),
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
  let createdAuthUserId: string | null = null;
  let profilePersisted = false;
  let hadProfileBefore = false;
  let createdRestaurantId: string | null = null;

  const rollbackOnboarding = async (): Promise<void> => {
    const rollbackErrors: string[] = [];
    const adminClient = getSupabaseAdminClient();

    logInfo("auth.complete_onboarding.rollback_started", {
      userId: user?.id ?? null,
      createdAuthUserId,
      createdRestaurantId,
      shouldRemoveProfile: profilePersisted && !hadProfileBefore,
    });

    if (createdRestaurantId) {
      try {
        const tenantId = await restaurantService.getTenantByRestaurantId(createdRestaurantId);

        if (tenantId) {
          const deleted = await restaurantService.deleteRestaurant(tenantId, createdRestaurantId);
          if (!deleted.isValid) {
            rollbackErrors.push(...deleted.errorMessages);
          } else {
            logInfo("auth.complete_onboarding.rollback_restaurant_succeeded", {
              tenantId,
              restaurantId: createdRestaurantId,
            });
          }
        }
      } catch (error) {
        rollbackErrors.push(error instanceof Error ? error.message : "Unknown restaurant rollback error");
      }
    }

    if (profilePersisted && !hadProfileBefore && user?.id) {
      try {
        const deletedProfile = await profileService.deleteBySupabaseUserId(user.id, {
          requestId,
        });
        if (!deletedProfile.isValid) {
          rollbackErrors.push(...deletedProfile.errorMessages);
        } else {
          logInfo("auth.complete_onboarding.rollback_profile_succeeded", {
            supabaseUserId: user.id,
          });
        }
      } catch (error) {
        rollbackErrors.push(error instanceof Error ? error.message : "Unknown profile rollback error");
      }
    }

    if (createdAuthUserId) {
      try {
        const removed = await adminClient.auth.admin.deleteUser(createdAuthUserId);
        if (removed.error) {
          rollbackErrors.push(removed.error.message);
        } else {
          logInfo("auth.complete_onboarding.rollback_auth_user_succeeded", {
            supabaseUserId: createdAuthUserId,
          });
        }
      } catch (error) {
        rollbackErrors.push(error instanceof Error ? error.message : "Unknown auth rollback error");
      }
    }

    if (rollbackErrors.length > 0) {
      logError("auth.complete_onboarding.rollback_failed", {
        userId: user?.id ?? null,
        createdAuthUserId,
        createdRestaurantId,
        errors: rollbackErrors,
      });
      return;
    }

    logInfo("auth.complete_onboarding.rollback_succeeded", {
      userId: user?.id ?? null,
      createdAuthUserId,
      createdRestaurantId,
    });
  };

  try {
    if (parsed.data.authMethod === "password") {
    const password = parsed.data.auth?.password;
    if (!password) {
      return failOnboarding("Senha obrigatoria para cadastro com email e senha");
    }

    const adminClient = getSupabaseAdminClient();
    const createdAuthUser = await adminClient.auth.admin.createUser({
      email: normalizedRestaurant.email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: normalizedOwner.fullName,
        portal: "restaurant",
      },
    });

    if (createdAuthUser.error || !createdAuthUser.data.user) {
      logError("auth.complete_onboarding.auth_user_create_failed", {
        authMethod: parsed.data.authMethod,
        restaurantEmail: normalizedRestaurant.email,
        message: createdAuthUser.error?.message ?? "Nao foi possivel criar o usuario",
      });
      return failOnboarding(createdAuthUser.error?.message ?? "Nao foi possivel criar o usuario");
    }

    user = createdAuthUser.data.user;
    createdAuthUserId = createdAuthUser.data.user.id;
    logInfo("auth.complete_onboarding.auth_user_created", {
      authMethod: parsed.data.authMethod,
      supabaseUserId: createdAuthUserId,
      restaurantEmail: normalizedRestaurant.email,
    });
    } else {
      const {
        data: { user: oauthUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !oauthUser) {
        logError("auth.complete_onboarding.google_user_fetch_failed", {
          authMethod: parsed.data.authMethod,
          message: error?.message ?? "Usuario Google nao autenticado",
        });
        return failOnboarding("Usuario Google nao autenticado. Refaça a autenticacao.");
      }

      user = oauthUser;
      logInfo("auth.complete_onboarding.google_user_loaded", {
        authMethod: parsed.data.authMethod,
        supabaseUserId: user.id,
      });
    }

    if (!user) {
      return failOnboarding("Usuario autenticado nao encontrado");
    }

    const resolvedEmail = (user.email ?? normalizedRestaurant.email).trim().toLowerCase();
    const avatarUrl =
      typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
    const usedGoogleEmail =
      parsed.data.authMethod === "google" && resolvedEmail !== normalizedRestaurant.email;

    hadProfileBefore = Boolean(await profileService.findBySupabaseUserId(user.id));

    const profileOutput = await profileService.upsert({
      supabaseUserId: user.id,
      email: resolvedEmail,
      fullName: normalizedOwner.fullName,
      birthDate: normalizedOwner.birthDate,
      document: normalizedOwner.document,
      role: "master",
      avatarUrl,
    }, { requestId });

    if (!profileOutput.isValid) {
      throw new Error(profileOutput.errorMessages.join("; "));
    }
    profilePersisted = true;
    logInfo("auth.complete_onboarding.profile_upsert_succeeded", {
      supabaseUserId: user.id,
      hadProfileBefore,
    });

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
        companyType: normalizedRestaurant.companyType,
        providerAvatarUrl: avatarUrl ?? "",
      },
      null,
      { appBaseUrl, sendWelcomeEmail: false, requestId }
    );

    if (!restaurantOutput.isValid || !restaurantOutput.result?.restaurantId) {
      throw new Error(restaurantOutput.errorMessages.join("; "));
    }
    createdRestaurantId = restaurantOutput.result.restaurantId;
    logInfo("auth.complete_onboarding.restaurant_register_succeeded", {
      supabaseUserId: user.id,
      restaurantId: createdRestaurantId,
    });

    if (parsed.data.authMethod === "password" && !user.email_confirmed_at) {
      await sendSignUpConfirmationEmail({
        email: normalizedRestaurant.email,
        fullName: normalizedOwner.fullName,
        supabaseUserId: user.id,
        appBaseUrl,
        requestId,
      });

      logInfo("auth.complete_onboarding.confirmation_email_sent", {
        supabaseUserId: user.id,
        email: normalizedRestaurant.email,
      });
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
    logInfo("auth.complete_onboarding.succeeded", {
      authMethod: parsed.data.authMethod,
      supabaseUserId: user.id,
      restaurantId: createdRestaurantId,
      redirectTo,
      usedGoogleEmail,
    });
    return okOnboarding({
      redirectTo,
      portalName: "Portal Cheffia",
      usedGoogleEmail,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado no onboarding";
    logError("auth.complete_onboarding.failed", {
      authMethod: parsed.data.authMethod,
      userId: user?.id ?? null,
      createdAuthUserId,
      createdRestaurantId,
      message,
    });
    await rollbackOnboarding();
    return failOnboarding(message);
  }
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

