import type { PayerProfile } from "./entities";
import { normalizeDigits } from "./provisioning";

export interface RawPayerInput {
  name: string | null | undefined;
  phoneNumber: string | null | undefined;
  email?: string | null | undefined;
  document?: string | null | undefined;
}

export interface PayerValidationResult {
  profile: PayerProfile | null;
  errors: string[];
}

const normalizeText = (value: string | null | undefined): string => (value ?? "").trim();

const normalizeEmail = (value: string | null | undefined): string | null => {
  const trimmed = normalizeText(value).toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

export const validateAndBuildPayerProfile = (input: RawPayerInput): PayerValidationResult => {
  const name = normalizeText(input.name);
  const phoneNumber = normalizeText(input.phoneNumber);
  const normalizedPhoneNumber = normalizeDigits(phoneNumber);
  const email = normalizeEmail(input.email);
  const normalizedDocument = normalizeDigits(input.document);
  const document = normalizedDocument.length > 0 ? normalizedDocument : null;
  const errors: string[] = [];

  if (name.length < 3) {
    errors.push("payer.name");
  }

  if (normalizedPhoneNumber.length < 10 || normalizedPhoneNumber.length > 13) {
    errors.push("payer.phoneNumber");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("payer.email");
  }

  if (document && ![11, 14].includes(document.length)) {
    errors.push("payer.document");
  }

  if (errors.length > 0) {
    return {
      profile: null,
      errors,
    };
  }

  return {
    profile: {
      name,
      phoneNumber,
      email,
      document,
      normalizedPhoneNumber,
      normalizedDocument: document,
    },
    errors: [],
  };
};

export const hasSamePayerProfile = (
  left: PayerProfile,
  right: Pick<PayerProfile, "name" | "normalizedPhoneNumber" | "email" | "normalizedDocument">
): boolean =>
  left.name === right.name &&
  left.normalizedPhoneNumber === right.normalizedPhoneNumber &&
  left.email === right.email &&
  left.normalizedDocument === right.normalizedDocument;
