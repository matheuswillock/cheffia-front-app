import type { EmailProviderSendResult } from "@/app/api/infra/external/email";

export interface EmailContext {
  kind:
    | "generic"
    | "password-reset"
    | "email-confirmation"
    | "welcome";
  requestId?: string | null;
  tenantId?: string | null;
  restaurantId?: string | null;
  supabaseUserId?: string | null;
}

export interface EmailSendSuccess {
  success: true;
  data: EmailProviderSendResult & {
    requestedTo: string[];
    deliveredTo: string[];
    testMode: boolean;
  };
}

export interface EmailSendFailure {
  success: false;
  error: string;
}

export type EmailSendResult = EmailSendSuccess | EmailSendFailure;

export interface RenderedEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface PasswordResetEmailInput {
  userName: string;
  userEmail: string;
  resetUrl: string;
}

export interface EmailConfirmationInput {
  userName: string;
  userEmail: string;
  confirmationUrl: string;
}

export interface WelcomeEmailInput {
  userName: string;
  userEmail: string;
  restaurantName: string;
  dashboardUrl: string;
}
