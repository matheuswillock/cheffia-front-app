
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Cover from "@/assets/cover.jpeg";
import Google from "@/assets/google.svg";
import type {
  CompleteRestaurantOnboardingInput,
  CompleteRestaurantOnboardingResponse,
} from "@/app/actions/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ArrowLeft as AnimatedArrowLeft } from "@/components/animate-ui/icons/arrow-left";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { fetchAddressByPostalCode, formatPostalCode } from "@/lib/api/postalCodeClient";
import { cn } from "@/lib/utils";
import { CalendarDays, Check, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const DRAFT_STORAGE_KEY = "cheffia:sign-up:draft:v1";
const SIGN_UP_IMAGE_SRC = "/assets/signup-gemini.png";

const STEP_DEFINITIONS = [
  {
    id: 1,
    title: "Etapa 1 - Restaurante",
    description: "Informe os dados básicos do restaurante para iniciar o cadastro.",
  },
  {
    id: 2,
    title: "Etapa 2 - Owner",
    description: "Defina o responsável principal da conta.",
  },
  {
    id: 3,
    title: "Etapa 3 - Acesso",
    description: "Configure o acesso com senha ou conclua com Google.",
  },
] as const;

const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "No mínimo 8 caracteres", test: (value: string) => value.length >= 8 },
  { id: "uppercase", label: "Pelo menos uma letra maiúscula", test: (value: string) => /[A-Z]/.test(value) },
  { id: "lowercase", label: "Pelo menos uma letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { id: "number", label: "Pelo menos um número", test: (value: string) => /\d/.test(value) },
  { id: "special", label: "Pelo menos um caractere especial", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

const signUpOnboardingSchema = z
  .object({
    name: z.string().trim().min(3, "Informe o nome do restaurante"),
    email: z.string().trim().email("Informe um e-mail válido"),
    restaurantDocument: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "Informe um CNPJ válido"),
    phoneNumber: z.string().trim().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Informe um telefone válido"),
    postalCode: z.string().trim().regex(/^\d{5}-\d{3}$/, "Informe um CEP válido"),
    address: z.string().trim().min(4, "Informe a rua ou avenida"),
    addressNumber: z.string().trim().min(1, "Informe o número"),
    province: z.string().trim().min(2, "Informe o bairro"),
    complement: z.string().trim().optional(),
    city: z.string().trim().min(2, "Informe a cidade"),
    state: z.string().trim().length(2, "Informe a UF com 2 letras"),
    fullName: z.string().trim().min(3, "Informe o nome completo do owner"),
    birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data de nascimento inválida"),
    document: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Informe um CPF válido"),
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número")
      .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caractere especial"),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.restaurantDocument.replace(/\D/g, "").length !== 14) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["restaurantDocument"],
        message: "O CNPJ deve conter 14 dígitos",
      });
    }

    if (!isValidCnpj(data.restaurantDocument)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["restaurantDocument"],
        message: "Informe um CNPJ válido",
      });
    }

    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "As senhas não conferem",
      });
    }

    if (data.document.replace(/\D/g, "").length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["document"],
        message: "O CPF deve conter 11 dígitos",
      });
    }

    if (!parseBirthDateDisplayToDate(data.birthDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["birthDate"],
        message: "Informe uma data de nascimento válida",
      });
    }
  });

type SignUpOnboardingValues = z.infer<typeof signUpOnboardingSchema>;
type StepNumber = 1 | 2 | 3;

const STEP_FIELDS: Record<StepNumber, Array<keyof SignUpOnboardingValues>> = {
  1: ["name", "email", "restaurantDocument", "phoneNumber", "postalCode", "address", "addressNumber", "province", "city", "state"],
  2: ["fullName", "birthDate", "document"],
  3: ["password", "confirmPassword"],
};

const DEFAULT_FORM_VALUES: SignUpOnboardingValues = {
  name: "",
  email: "",
  restaurantDocument: "",
  phoneNumber: "",
  postalCode: "",
  address: "",
  addressNumber: "",
  province: "",
  complement: "",
  city: "",
  state: "",
  fullName: "",
  birthDate: "",
  document: "",
  password: "",
  confirmPassword: "",
};

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatCnpj = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
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

const formatCpf = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatBirthDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseBirthDateDisplayToDate = (value: string): Date | null => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!day || !month || !year) return null;

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const parseBirthDateDisplayToIso = (value: string): string | null => {
  const parsed = parseBirthDateDisplayToDate(value);
  if (!parsed) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeBirthDateForForm = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-");
    return `${day}/${month}/${year}`;
  }

  return formatBirthDateInput(trimmed);
};

const getBirthDatePreviewMonth = (value: string): Date | null => {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return null;

  const month = Number(digits.slice(2, 4));
  if (!month || month < 1 || month > 12) return null;

  let year = new Date().getFullYear();
  if (digits.length >= 8) {
    const parsedYear = Number(digits.slice(4, 8));
    if (!parsedYear || parsedYear < 1900 || parsedYear > 2100) {
      return null;
    }
    year = parsedYear;
  }

  return new Date(year, month - 1, 1);
};

const mapOnboardingErrorMessage = (message: string | null | undefined): string => {
  const normalized = (message ?? "").toLowerCase();

  if (normalized.includes("address already in use")) {
    return "Este e-mail já está em uso. Tente entrar na conta ou use outro e-mail.";
  }

  if (normalized.includes("a user with this email address has already been registered")) {
    return "Este e-mail já está cadastrado. Faça login ou use outro e-mail.";
  }

  if (normalized.includes("email rate limit exceeded") || normalized.includes("rate limit")) {
    return "Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.";
  }

  return message ?? "Revise os dados e tente novamente.";
};

const normalizeState = (value: string): string => value.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();

interface SignUpFormProps extends ComponentProps<"div"> {
  onCompleteOnboarding: (
    input: CompleteRestaurantOnboardingInput
  ) => Promise<CompleteRestaurantOnboardingResponse>;
  googleSignUp: (nextPath?: string) => Promise<void>;
}

export function SignUpForm({
  className,
  onCompleteOnboarding,
  googleSignUp,
  ...props
}: SignUpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepLookupError, setCepLookupError] = useState<string | null>(null);
  const [lastLookupCep, setLastLookupCep] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [successRedirectTo, setSuccessRedirectTo] = useState<string | null>(null);
  const [successPortalName, setSuccessPortalName] = useState("Portal Cheffia");
  const [countdown, setCountdown] = useState(5);
  const [isGoogleResumeFlow, setIsGoogleResumeFlow] = useState(false);
  const [isBirthDateCalendarOpen, setIsBirthDateCalendarOpen] = useState(false);
  const [hasSignUpImageError, setHasSignUpImageError] = useState(false);

  const hasHandledGoogleResumeRef = useRef(false);
  const birthDateCalendarRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<SignUpOnboardingValues>({
    resolver: zodResolver(signUpOnboardingSchema),
    mode: "onChange",
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const currentPassword = form.watch("password") ?? "";
  const currentConfirmPassword = form.watch("confirmPassword") ?? "";
  const currentEmail = form.watch("email") ?? "";
  const currentRestaurantDocument = form.watch("restaurantDocument") ?? "";
  const currentName = form.watch("name") ?? "";
  const currentPhoneNumber = form.watch("phoneNumber") ?? "";
  const currentPostalCode = form.watch("postalCode") ?? "";
  const currentAddress = form.watch("address") ?? "";
  const currentAddressNumber = form.watch("addressNumber") ?? "";
  const currentProvince = form.watch("province") ?? "";
  const currentCity = form.watch("city") ?? "";
  const currentState = form.watch("state") ?? "";
  const currentFullName = form.watch("fullName") ?? "";
  const currentBirthDate = form.watch("birthDate") ?? "";
  const currentDocument = form.watch("document") ?? "";
  const signUpImageSource = hasSignUpImageError ? Cover : SIGN_UP_IMAGE_SRC;

  const passwordRequirementsMet = useMemo(
    () => PASSWORD_REQUIREMENTS.filter((rule) => rule.test(currentPassword)).length,
    [currentPassword]
  );

  const passwordStrength = useMemo(
    () => Math.round((passwordRequirementsMet / PASSWORD_REQUIREMENTS.length) * 100),
    [passwordRequirementsMet]
  );

  const hasStepThreeRequiredFields =
    currentEmail.trim().length > 0 &&
    currentPassword.trim().length > 0 &&
    currentConfirmPassword.trim().length > 0;

  const canSubmitSignUp =
    hasStepThreeRequiredFields &&
    passwordRequirementsMet === PASSWORD_REQUIREMENTS.length &&
    !form.formState.errors.email &&
    !form.formState.errors.password &&
    !form.formState.errors.confirmPassword;

  const hasStepOneRequiredFields =
    currentName.trim().length > 0 &&
    currentEmail.trim().length > 0 &&
    currentRestaurantDocument.trim().length > 0 &&
    currentPhoneNumber.trim().length > 0 &&
    currentPostalCode.trim().length > 0 &&
    currentAddress.trim().length > 0 &&
    currentAddressNumber.trim().length > 0 &&
    currentProvince.trim().length > 0 &&
    currentCity.trim().length > 0 &&
    currentState.trim().length > 0;

  const canContinueStepOne =
    hasStepOneRequiredFields &&
    !isCepLoading &&
    !cepLookupError &&
    !form.formState.errors.name &&
    !form.formState.errors.email &&
    !form.formState.errors.restaurantDocument &&
    !form.formState.errors.phoneNumber &&
    !form.formState.errors.postalCode &&
    !form.formState.errors.address &&
    !form.formState.errors.addressNumber &&
    !form.formState.errors.province &&
    !form.formState.errors.city &&
    !form.formState.errors.state;

  const hasStepTwoRequiredFields =
    currentFullName.trim().length > 0 &&
    currentBirthDate.trim().length > 0 &&
    currentDocument.trim().length > 0;

  const canContinueStepTwo =
    hasStepTwoRequiredFields &&
    !form.formState.errors.fullName &&
    !form.formState.errors.birthDate &&
    !form.formState.errors.document;

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  const saveDraft = useCallback(
    (nextStep: StepNumber = currentStep) => {
      if (typeof window === "undefined") return;
      const values = form.getValues();
      const draft = {
        name: values.name,
        email: values.email,
        restaurantDocument: values.restaurantDocument,
        phoneNumber: values.phoneNumber,
        postalCode: values.postalCode,
        address: values.address,
        addressNumber: values.addressNumber,
        province: values.province,
        complement: values.complement,
        city: values.city,
        state: values.state,
        fullName: values.fullName,
        birthDate: values.birthDate,
        document: values.document,
        currentStep: nextStep,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    },
    [currentStep, form]
  );

  const restoreDraft = useCallback(() => {
    if (typeof window === "undefined") return false;
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return false;

    try {
      const parsed = JSON.parse(raw) as Partial<SignUpOnboardingValues> & {
        currentStep?: StepNumber;
      };
      form.reset(
        {
          ...DEFAULT_FORM_VALUES,
          ...parsed,
          birthDate: normalizeBirthDateForForm(parsed.birthDate ?? ""),
          password: "",
          confirmPassword: "",
        },
        { keepDefaultValues: true }
      );

      if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 3) {
        setCurrentStep(parsed.currentStep);
      }
      return true;
    } catch {
      return false;
    }
  }, [form]);

  const buildPayload = useCallback(
    (authMethod: "password" | "google"): CompleteRestaurantOnboardingInput => {
      const values = form.getValues();
      return {
        authMethod,
        restaurant: {
          name: values.name,
          email: values.email,
          document: values.restaurantDocument,
          phoneNumber: values.phoneNumber,
          postalCode: values.postalCode,
          address: values.address,
          addressNumber: values.addressNumber,
          province: values.province,
          complement: values.complement,
          city: values.city,
          state: values.state,
        },
        owner: {
          fullName: values.fullName,
          birthDate: parseBirthDateDisplayToIso(values.birthDate) ?? "",
          document: values.document,
        },
        auth:
          authMethod === "password"
            ? {
                password: values.password,
                confirmPassword: values.confirmPassword,
              }
            : undefined,
      };
    },
    [form]
  );

  const runOnboarding = useCallback(
    async (authMethod: "password" | "google") => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        const stepOneValid = await form.trigger(STEP_FIELDS[1], { shouldFocus: true });
        if (!stepOneValid) {
          setCurrentStep(1);
          return;
        }

        const stepTwoValid = await form.trigger(STEP_FIELDS[2], { shouldFocus: true });
        if (!stepTwoValid) {
          setCurrentStep(2);
          return;
        }

        if (authMethod === "password") {
          const stepThreeValid = await form.trigger(STEP_FIELDS[3], { shouldFocus: true });
          if (!stepThreeValid) {
            setCurrentStep(3);
            return;
          }
        }

        const response = await onCompleteOnboarding(buildPayload(authMethod));

        if (!response.isValid || !response.result) {
          toast.error("Não foi possível concluir o cadastro", {
            description: mapOnboardingErrorMessage(response.errorMessages[0]),
          });
          return;
        }

        if (response.result.usedGoogleEmail) {
          toast.info("E-mail atualizado", {
            description: "O e-mail foi atualizado automaticamente para o e-mail da conta Google.",
          });
        }

        clearDraft();
        setCountdown(5);
        setSuccessPortalName(response.result.portalName || "Portal Cheffia");
        setSuccessRedirectTo(response.result.redirectTo || "/sign-in");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro inesperado";
        toast.error("Não foi possível concluir o cadastro", {
          description: mapOnboardingErrorMessage(message),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [buildPayload, clearDraft, form, isSubmitting, onCompleteOnboarding]
  );

  const handleGoogleSignUp = useCallback(async () => {
    const stepOneValid = await form.trigger(STEP_FIELDS[1], { shouldFocus: true });
    if (!stepOneValid) {
      setCurrentStep(1);
      return;
    }

    const stepTwoValid = await form.trigger(STEP_FIELDS[2], { shouldFocus: true });
    if (!stepTwoValid) {
      setCurrentStep(2);
      return;
    }

    saveDraft(3);

    try {
      await googleSignUp("/sign-up?resume=google");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao iniciar autenticação Google";
      toast.error("Falha na autenticação com Google", {
        description: message,
      });
    }
  }, [form, googleSignUp, saveDraft]);

  const handleSubmitPassword = form.handleSubmit(async () => {
    await runOnboarding("password");
  });

  const handlePostalCodeBlur = useCallback(async () => {
    const currentPostalCode = form.getValues("postalCode");
    const formattedPostalCode = formatPostalCode(currentPostalCode);
    const sanitizedPostalCode = formattedPostalCode.replace(/\D/g, "");

    form.setValue("postalCode", formattedPostalCode, {
      shouldDirty: true,
      shouldValidate: true,
    });

    setCepLookupError(null);
    await form.trigger("postalCode");

    if (sanitizedPostalCode.length !== 8 || lastLookupCep === sanitizedPostalCode) {
      return;
    }

    setIsCepLoading(true);

    try {
      const addressData = await fetchAddressByPostalCode(sanitizedPostalCode);

      if (!addressData) {
        setCepLookupError("Não foi possível localizar esse CEP.");
        toast.error("Não foi possível localizar esse CEP.", {
          description: "Confira o CEP e complete o endereço manualmente.",
        });
        return;
      }

      form.setValue("postalCode", addressData.postalCode, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (addressData.street) {
        form.setValue("address", addressData.street, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (addressData.province) {
        form.setValue("province", addressData.province, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (addressData.city) {
        form.setValue("city", addressData.city, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (addressData.state) {
        form.setValue("state", normalizeState(addressData.state), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      setLastLookupCep(sanitizedPostalCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado";
      console.error("sign_up.cep_lookup_failed", {
        message,
      });
      setCepLookupError("Erro ao buscar CEP.");
      toast.error("Erro ao buscar CEP.", {
        description: "Tente novamente ou preencha os campos manualmente.",
      });
    } finally {
      setIsCepLoading(false);
    }
  }, [form, lastLookupCep]);

  const handleNextStep = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep];
    const isValid = await form.trigger(fields, { shouldFocus: true });
    if (!isValid) {
      return;
    }

    const nextStep = Math.min(currentStep + 1, 3) as StepNumber;
    saveDraft(nextStep);
    setCurrentStep(nextStep);
  }, [currentStep, form, saveDraft]);

  const handleTopBackAction = useCallback(() => {
    if (currentStep === 1) {
      clearDraft();
      router.push("/sign-in");
      return;
    }

    const previousStep = Math.max(currentStep - 1, 1) as StepNumber;
    saveDraft(previousStep);
    setCurrentStep(previousStep);
  }, [clearDraft, currentStep, router, saveDraft]);

  const confirmCancel = useCallback(() => {
    clearDraft();
    router.push("/sign-in");
  }, [clearDraft, router]);

  useEffect(() => {
    restoreDraft();
  }, [restoreDraft]);

  useEffect(() => {
    const resumeMode = searchParams.get("resume");
    if (resumeMode !== "google" || hasHandledGoogleResumeRef.current) {
      return;
    }

    hasHandledGoogleResumeRef.current = true;
    const hasDraft = restoreDraft();
    setCurrentStep(3);

    if (!hasDraft) {
      toast.error("Rascunho não encontrado", {
        description: "Preencha as etapas anteriores para concluir com Google.",
      });
      return;
    }

    setIsGoogleResumeFlow(true);
    void runOnboarding("google").finally(() => {
      setIsGoogleResumeFlow(false);
    });
  }, [restoreDraft, runOnboarding, searchParams]);

  useEffect(() => {
    if (!successRedirectTo) return;

    if (countdown <= 0) {
      router.push(successRedirectTo);
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, router, successRedirectTo]);

  useEffect(() => {
    if (!isBirthDateCalendarOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (birthDateCalendarRef.current && !birthDateCalendarRef.current.contains(event.target as Node)) {
        setIsBirthDateCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBirthDateCalendarOpen]);

  if (successRedirectTo) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden bg-background-default">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="flex flex-col justify-center gap-6 px-6 py-8 md:px-8">
              <div className="flex items-center gap-3 text-primary">
                <CheckCircle2 className="size-6" />
                <span className="text-sm font-semibold uppercase tracking-wide">Cadastro concluído</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-bold">Sucesso! Seu cadastro foi finalizado.</h1>
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado para o {successPortalName} em {countdown} segundos.
                </p>
              </div>

              <Button
                type="button"
                className="w-fit rounded-xl bg-button font-semibold text-foreground-black hover:bg-button-dark"
                onClick={() => router.push(successRedirectTo)}
              >
                Ir agora
              </Button>
            </div>

            <div className="relative hidden bg-muted md:block">
              <Image
                src={signUpImageSource}
                alt="Cadastro finalizado"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
                onError={() => setHasSignUpImageError(true)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-background-default">
        <CardContent className="p-0">
          <div className="relative mb-6 mt-8 flex flex-col gap-6 px-6 md:px-8">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleTopBackAction}
              className="absolute left-6 top-0 rounded-md bg-button text-foreground-black hover:bg-button-dark hover:text-foreground-black"
            >
              <AnimatedArrowLeft aria-hidden="true" size={16} animateOnHover />
              <span className="sr-only">Voltar etapa</span>
            </Button>

            <div className="pt-12">
              <div className="mb-8 flex items-center justify-center">
                {STEP_DEFINITIONS.map((step, index) => {
                  const isCurrent = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={cn(
                          "flex size-16 items-center justify-center rounded-full border text-2xl font-semibold transition-colors",
                          isCurrent || isCompleted ? "border-primary text-primary" : "border-border text-muted-foreground"
                        )}
                      >
                        {step.id}
                      </div>

                      {index < STEP_DEFINITIONS.length - 1 && (
                        <div
                          className={cn(
                            "h-0.5 w-16 transition-colors",
                            currentStep > step.id ? "bg-primary" : "bg-border"
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <h1 className="text-2xl font-bold">{STEP_DEFINITIONS[currentStep - 1].title}</h1>
                <p className="text-sm text-muted-foreground">{STEP_DEFINITIONS[currentStep - 1].description}</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={handleSubmitPassword} className="space-y-5 [&_label]:pl-3">
                {currentStep === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do restaurante</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome do restaurante" className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail do restaurante</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="restaurante@email.com" className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="restaurantDocument"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ do restaurante</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              inputMode="numeric"
                              placeholder="00.000.000/0000-00"
                              className="rounded-xl"
                              onChange={(event) => {
                                field.onChange(formatCnpj(event.target.value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="(11) 99999-9999"
                              className="rounded-xl"
                              onChange={(event) => {
                                field.onChange(formatPhoneNumber(event.target.value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                placeholder="01310-100"
                                className="rounded-xl pr-10"
                                onBlur={handlePostalCodeBlur}
                                onChange={(event) => {
                                  const formatted = formatPostalCode(event.target.value);
                                  field.onChange(formatted);

                                  const digits = formatted.replace(/\D/g, "");
                                  if (digits !== lastLookupCep) {
                                    setCepLookupError(null);
                                  }
                                }}
                              />
                            </FormControl>
                            {isCepLoading && (
                              <Spinner className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                            )}
                          </div>
                          <FormMessage>
                            {form.formState.errors.postalCode?.message ?? cepLookupError}
                          </FormMessage>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rua ou avenida</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Av. Paulista" className="rounded-xl" disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="addressNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="1000" className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Bela Vista" className="rounded-xl" disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="São Paulo" className="rounded-xl" disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UF</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="SP" className="rounded-xl" disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento (opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Sala, bloco, referência" className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo do owner</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Maria da Silva" className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => {
                          const selectedDate = parseBirthDateDisplayToDate(field.value ?? "") ?? undefined;
                          const previewMonth = getBirthDatePreviewMonth(field.value ?? "") ?? undefined;
                          const currentYear = new Date().getFullYear();

                          return (
                            <FormItem>
                              <FormLabel>Data de nascimento</FormLabel>
                              <div ref={birthDateCalendarRef} className="relative overflow-visible">
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="text"
                                      inputMode="numeric"
                                      placeholder="dd/mm/aaaa"
                                      className="rounded-xl pr-10"
                                      maxLength={10}
                                      onChange={(event) => {
                                        const formatted = formatBirthDateInput(event.target.value);
                                        field.onChange(formatted);
                                      }}
                                      onFocus={() => setIsBirthDateCalendarOpen(true)}
                                    />
                                  </FormControl>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsBirthDateCalendarOpen((previous) => !previous)}
                                  >
                                    <CalendarDays className="size-4" />
                                    <span className="sr-only">Abrir calendário</span>
                                  </Button>
                                </div>

                                {isBirthDateCalendarOpen && (
                                  <div className="absolute inset-x-0 top-full z-50 mt-2 w-full">
                                    <Calendar
                                      mode="single"
                                      selected={selectedDate}
                                      month={previewMonth ?? selectedDate}
                                      onSelect={(date) => {
                                        if (!date) return;
                                        field.onChange(format(date, "dd/MM/yyyy"));
                                        setIsBirthDateCalendarOpen(false);
                                        void form.trigger("birthDate");
                                      }}
                                      disabled={(date) => date > new Date()}
                                      captionLayout="dropdown"
                                      fromYear={currentYear - 100}
                                      toYear={currentYear}
                                      className="w-full rounded-xl border bg-background-default shadow-xl [--cell-size:2.25rem]"
                                      classNames={{
                                        root: "w-full",
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="document"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                placeholder="000.000.000-00"
                                className="rounded-xl"
                                onChange={(event) => {
                                  field.onChange(formatCpf(event.target.value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail de acesso</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly disabled className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <InputGroup>
                              <InputGroupInput
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Digite sua senha"
                                aria-invalid={fieldState.invalid}
                              />
                              <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                  onClick={() => setShowPassword((value) => !value)}
                                >
                                  {showPassword ? <EyeOff /> : <Eye />}
                                </InputGroupButton>
                              </InputGroupAddon>
                            </InputGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Confirmar senha</FormLabel>
                          <FormControl>
                            <InputGroup>
                              <InputGroupInput
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Repita sua senha"
                                aria-invalid={fieldState.invalid}
                              />
                              <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  aria-label={showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"}
                                  onClick={() => setShowConfirmPassword((value) => !value)}
                                >
                                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                                </InputGroupButton>
                              </InputGroupAddon>
                            </InputGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-sm font-medium">Sua senha precisa atender às regras abaixo:</p>
                      <Progress value={passwordStrength} />
                      <div className="space-y-2">
                        {PASSWORD_REQUIREMENTS.map((rule) => {
                          const isMet = rule.test(currentPassword);
                          return (
                            <div key={rule.id} className="flex items-center gap-2 text-sm">
                              <Check className={cn("size-4", isMet ? "text-primary" : "text-muted-foreground")} />
                              <span className={isMet ? "text-foreground" : "text-muted-foreground"}>{rule.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl font-semibold"
                      onClick={handleGoogleSignUp}
                      disabled={isSubmitting || isGoogleResumeFlow}
                    >
                      {isGoogleResumeFlow ? (
                        <>
                          <Spinner data-icon="inline-start" />
                          Finalizando com Google...
                        </>
                      ) : (
                        <>
                          <Image src={Google} alt="Google" width={20} height={20} />
                          Continuar com Google
                        </>
                      )}
                    </Button>
                  </>
                )}

                <div className="flex items-center justify-between gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setIsCancelDialogOpen(true)}
                  >
                    Cancelar
                  </Button>

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      className="flex-1 rounded-xl bg-button font-semibold text-foreground-black hover:bg-button-dark"
                      onClick={handleNextStep}
                      disabled={
                        currentStep === 1
                          ? !canContinueStepOne
                          : currentStep === 2
                            ? !canContinueStepTwo
                            : false
                      }
                    >
                      Continuar
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="flex-1 rounded-xl bg-button font-semibold text-foreground-black hover:bg-button-dark"
                      disabled={!canSubmitSignUp || isSubmitting || isGoogleResumeFlow}
                      aria-busy={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner data-icon="inline-start" />
                          Cadastrando...
                        </span>
                      ) : (
                        "Cadastrar"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        Ao clicar em continuar, você concorda com nossos <a href="#">Termos de Serviço</a> e <a href="#">Política de Privacidade</a>.
      </div>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar cadastro?</AlertDialogTitle>
            <AlertDialogDescription>
              Seus dados não salvos serão descartados e você voltará para a tela de login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Confirmar cancelamento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

