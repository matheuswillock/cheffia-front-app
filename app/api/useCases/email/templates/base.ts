import type { RenderedEmailTemplate } from "../types";

interface BaseTemplateInput {
  subject: string;
  preheader: string;
  heading: string;
  intro: string;
  body: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  outro?: string;
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const renderBaseTemplate = (input: BaseTemplateInput): RenderedEmailTemplate => {
  const bodyHtml = input.body
    .map((line) => `<p style="margin: 0 0 16px 0; color: #525252; font-size: 16px; line-height: 1.7;">${escapeHtml(line)}</p>`)
    .join("");
  const outroHtml = input.outro
    ? `<p style="margin: 24px 0 0 0; color: #737373; font-size: 14px; line-height: 1.6;">${escapeHtml(
        input.outro
      )}</p>`
    : "";
  const ctaHtml =
    input.ctaLabel && input.ctaUrl
      ? `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${input.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 16px;">
            ${escapeHtml(input.ctaLabel)}
          </a>
        </div>
      `
      : "";

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(input.subject)}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
          ${escapeHtml(input.preheader)}
        </div>
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 32px 16px;">
              <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);">
                <tr>
                  <td style="padding: 32px; background: linear-gradient(135deg, #1f2937 0%, #111827 100%);">
                    <p style="margin: 0; color: #fdba74; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;">Cheffia</p>
                    <h1 style="margin: 12px 0 0 0; color: #ffffff; font-size: 28px; line-height: 1.2;">${escapeHtml(
                      input.heading
                    )}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 16px 0; color: #171717; font-size: 18px; line-height: 1.6;">${escapeHtml(
                      input.intro
                    )}</p>
                    ${bodyHtml}
                    ${ctaHtml}
                    ${outroHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 32px; background-color: #fafafa; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                      Este e-mail foi enviado automaticamente pela Cheffia.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `.trim();

  const lines = [input.intro, ...input.body];
  if (input.ctaLabel && input.ctaUrl) {
    lines.push(`${input.ctaLabel}: ${input.ctaUrl}`);
  }
  if (input.outro) lines.push(input.outro);

  return {
    subject: input.subject,
    html,
    text: lines.join("\n\n"),
  };
};
