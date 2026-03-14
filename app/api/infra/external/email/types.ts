export interface EmailProviderSendInput {
  to: string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

export interface EmailProviderSendResult {
  provider: "resend";
  messageId: string | null;
}

export interface EmailProvider {
  send(input: EmailProviderSendInput): Promise<EmailProviderSendResult>;
}

export interface EmailProviderConfig {
  from: string;
  replyTo: string | null;
  testMode: boolean;
  ownerEmail: string | null;
}
