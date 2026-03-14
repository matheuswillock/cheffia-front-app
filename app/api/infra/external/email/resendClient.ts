import "server-only";

import { Resend } from "resend";
import type {
  EmailProvider,
  EmailProviderConfig,
  EmailProviderSendInput,
  EmailProviderSendResult,
} from "./types";

let cachedClient: Resend | null = null;

const normalizeBooleanEnv = (value: string | undefined): boolean =>
  String(value ?? "")
    .trim()
    .toLowerCase() === "true";

export const getEmailProviderConfig = (): EmailProviderConfig & { apiKey: string } => {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || null;
  const ownerEmail = process.env.RESEND_OWNER_EMAIL?.trim() || null;
  const testMode = normalizeBooleanEnv(process.env.EMAIL_TEST_MODE);

  if (!apiKey) throw new Error("Missing RESEND_API_KEY environment variable.");
  if (!from) throw new Error("Missing EMAIL_FROM environment variable.");
  if (testMode && !ownerEmail) {
    throw new Error("RESEND_OWNER_EMAIL is required when EMAIL_TEST_MODE=true.");
  }

  return {
    apiKey,
    from,
    replyTo,
    ownerEmail,
    testMode,
  };
};

export const getResendClient = (): Resend => {
  if (cachedClient) return cachedClient;

  const config = getEmailProviderConfig();
  cachedClient = new Resend(config.apiKey);
  return cachedClient;
};

export class ResendEmailProvider implements EmailProvider {
  public async send(input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    const client = getResendClient();
    const response = await client.emails.send({
      from: input.from ?? getEmailProviderConfig().from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      provider: "resend",
      messageId: response.data?.id ?? null,
    };
  }
}
