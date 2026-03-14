import type { OrderPrintTicketPayload, PrintPaperProfile } from "@/lib/printing/contracts";

const DEFAULT_PROFILE: Exclude<PrintPaperProfile, "auto"> = "80mm";

const charsPerLineByProfile: Record<Exclude<PrintPaperProfile, "auto">, number> = {
  "58mm": 32,
  "80mm": 48,
};

const repeat = (char: string, size: number): string => new Array(Math.max(0, size)).fill(char).join("");

const safe = (value: string | null | undefined): string => {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : "-";
};

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const wrapText = (input: string, lineWidth: number): string[] => {
  const text = normalizeWhitespace(input);
  if (!text.length) return [""];

  const tokens = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const token of tokens) {
    const tokenValue = token.trim();
    if (!tokenValue.length) continue;

    if (!current.length) {
      current = tokenValue;
      continue;
    }

    const candidate = `${current} ${tokenValue}`;
    if (candidate.length <= lineWidth) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = tokenValue;
  }

  if (current.length) lines.push(current);
  return lines.length ? lines : [""];
};

export const resolvePrintProfile = (
  profile: PrintPaperProfile | null | undefined
): Exclude<PrintPaperProfile, "auto"> => {
  if (profile === "58mm" || profile === "80mm") return profile;
  return DEFAULT_PROFILE;
};

export const resolveCharsPerLine = (profile: PrintPaperProfile | null | undefined): number => {
  const resolved = resolvePrintProfile(profile);
  return charsPerLineByProfile[resolved];
};

export interface FormatOrderTicketOptions {
  profile?: PrintPaperProfile | null;
}

export const formatOrderTicket = (
  payload: OrderPrintTicketPayload,
  options: FormatOrderTicketOptions = {}
): string => {
  const lineWidth = resolveCharsPerLine(options.profile);
  const divider = repeat("-", lineWidth);

  const createdAt = new Date(payload.orderDateTime).toLocaleString("pt-BR", {
    hour12: false,
  });

  const lines: string[] = [
    "CHEFFIA - NOVO PEDIDO",
    divider,
    `Data/Hora: ${createdAt}`,
    `Pedido: #${payload.orderNumber}`,
    `Mesa/Balcao: ${safe(payload.tableOrCounter)}`,
    `Atendimento: ${safe(payload.serviceMode)}`,
    divider,
  ];

  for (const item of payload.items) {
    const itemLabel = `${Math.max(1, Number(item.quantity) || 1)}x ${safe(item.itemName)}`;
    lines.push(...wrapText(itemLabel, lineWidth));

    const observation = normalizeWhitespace(item.observation ?? "");
    if (observation.length) {
      for (const line of wrapText(`! OBS: ${observation.toUpperCase()}`, lineWidth)) {
        lines.push(line);
      }
    }

    lines.push(divider);
  }

  lines.push(`Itens: ${payload.items.length}`);
  lines.push(`EventId: ${payload.eventId}`);

  return `${lines.join("\n")}\n`;
};
