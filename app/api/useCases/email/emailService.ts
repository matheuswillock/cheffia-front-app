import type { EmailProvider, EmailProviderConfig } from "@/app/api/infra/external/email";
import {
  ResendEmailProvider,
  getEmailProviderConfig,
} from "@/app/api/infra/external/email";
import {
  renderEmailConfirmationTemplate,
  renderPasswordResetTemplate,
  renderWelcomeTemplate,
} from "./templates";
import type {
  EmailConfirmationInput,
  EmailContext,
  EmailSendResult,
  PasswordResetEmailInput,
  WelcomeEmailInput,
} from "./types";

interface GenericEmailInput {
  to: string[];
  subject: string;
  html: string;
  text: string;
}

const dedupeRecipients = (recipients: string[]): string[] =>
  Array.from(
    new Set(
      recipients
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );

const getFallbackUserName = (email: string): string => {
  const [localPart = "Cheffia"] = email.split("@");
  return localPart || "Cheffia";
};

export class EmailService {
  constructor(
    private readonly provider: EmailProvider = new ResendEmailProvider(),
    private readonly configFactory: () => EmailProviderConfig & { apiKey: string } = getEmailProviderConfig
  ) {}

  private getConfig(): EmailProviderConfig & { apiKey: string } {
    return this.configFactory();
  }

  private decorateForTestMode(html: string, requestedTo: string[]): string {
    const list = requestedTo.join(", ");
    return `
      <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; margin-bottom: 16px; color: #9a3412; font-size: 14px; line-height: 1.5;">
        EMAIL_TEST_MODE ativo. Destinatarios originais: ${list}
      </div>
      ${html}
    `.trim();
  }

  private logFailure(context: EmailContext, message: string): void {
    console.error("email.send.failed", {
      kind: context.kind,
      tenantId: context.tenantId ?? null,
      restaurantId: context.restaurantId ?? null,
      supabaseUserId: context.supabaseUserId ?? null,
      message,
    });
  }

  private async sendGenericEmail(
    input: GenericEmailInput,
    context: EmailContext
  ): Promise<EmailSendResult> {
    try {
      const config = this.getConfig();
      const requestedTo = dedupeRecipients(input.to);

      if (process.env.NODE_ENV === "development") {
        console.info("email.send.skipped_in_development", {
          kind: context.kind,
          tenantId: context.tenantId ?? null,
          restaurantId: context.restaurantId ?? null,
          supabaseUserId: context.supabaseUserId ?? null,
          requestedTo,
        });

        return {
          success: true,
          data: {
            provider: "resend",
            messageId: null,
            requestedTo,
            deliveredTo: [],
            testMode: true,
          },
        };
      }

      const deliveredTo = config.testMode
        ? dedupeRecipients([config.ownerEmail ?? ""])
        : requestedTo;

      if (!requestedTo.length) {
        return {
          success: false,
          error: "At least one recipient is required.",
        };
      }

      const subject = config.testMode
        ? `[EMAIL_TEST_MODE] ${input.subject}`
        : input.subject;
      const html = config.testMode
        ? this.decorateForTestMode(input.html, requestedTo)
        : input.html;
      const text = config.testMode
        ? `EMAIL_TEST_MODE ativo. Destinatarios originais: ${requestedTo.join(", ")}\n\n${input.text}`
        : input.text;

      const response = await this.provider.send({
        to: deliveredTo,
        subject,
        html,
        text,
        from: config.from,
        ...(config.replyTo ? { replyTo: config.replyTo } : {}),
      });

      return {
        success: true,
        data: {
          ...response,
          requestedTo,
          deliveredTo,
          testMode: config.testMode,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected email error";
      this.logFailure(context, message);
      return {
        success: false,
        error: message,
      };
    }
  }

  public async sendPasswordResetEmail(
    input: PasswordResetEmailInput,
    context: Omit<EmailContext, "kind"> = {}
  ): Promise<EmailSendResult> {
    const rendered = renderPasswordResetTemplate({
      ...input,
      userName: input.userName.trim() || getFallbackUserName(input.userEmail),
    });

    return this.sendGenericEmail(
      {
        to: [input.userEmail],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      },
      {
        ...context,
        kind: "password-reset",
      }
    );
  }

  public async sendEmailConfirmationEmail(
    input: EmailConfirmationInput,
    context: Omit<EmailContext, "kind"> = {}
  ): Promise<EmailSendResult> {
    const rendered = renderEmailConfirmationTemplate({
      ...input,
      userName: input.userName.trim() || getFallbackUserName(input.userEmail),
    });

    return this.sendGenericEmail(
      {
        to: [input.userEmail],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      },
      {
        ...context,
        kind: "email-confirmation",
      }
    );
  }

  public async sendWelcomeEmail(
    input: WelcomeEmailInput,
    context: Omit<EmailContext, "kind"> = {}
  ): Promise<EmailSendResult> {
    const rendered = renderWelcomeTemplate({
      ...input,
      userName: input.userName.trim() || getFallbackUserName(input.userEmail),
    });

    return this.sendGenericEmail(
      {
        to: [input.userEmail],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      },
      {
        ...context,
        kind: "welcome",
      }
    );
  }
}

let cachedEmailService: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (cachedEmailService) return cachedEmailService;
  cachedEmailService = new EmailService();
  return cachedEmailService;
};
