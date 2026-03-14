declare const Bun: any;
import net from "node:net";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { formatOrderTicket, resolvePrintProfile } from "@/lib/printing/formatTicket";
import type { OrderPrintTicketPayload, PrintPaperProfile } from "@/lib/printing/contracts";

const host = process.env.PRINT_AGENT_HOST?.trim() || "127.0.0.1";
const port = Number(process.env.PRINT_AGENT_PORT ?? 7777);
const transport = (process.env.PRINT_AGENT_TRANSPORT?.trim().toLowerCase() || "mock") as
  | "mock"
  | "tcp";
const printerHost = process.env.PRINT_AGENT_PRINTER_HOST?.trim() || "127.0.0.1";
const printerPort = Number(process.env.PRINT_AGENT_PRINTER_PORT ?? 9100);
const defaultProfile =
  (process.env.PRINT_AGENT_DEFAULT_PROFILE?.trim() as PrintPaperProfile | undefined) || "auto";
const spoolDirectory =
  process.env.PRINT_AGENT_MOCK_SPOOL_DIR?.trim() || path.resolve(process.cwd(), ".print-agent", "outbox");

const cutCommand = Buffer.from([0x1d, 0x56, 0x00]);

interface LocalPrintPayload extends OrderPrintTicketPayload {
  printerProfile?: PrintPaperProfile;
}

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders });

const validatePayload = (value: unknown): { payload: LocalPrintPayload | null; error: string | null } => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { payload: null, error: "Invalid JSON payload" };
  }

  const raw = value as Record<string, unknown>;

  const requiredStringKeys: Array<keyof OrderPrintTicketPayload> = [
    "eventId",
    "restaurantId",
    "customerOrderId",
    "orderDateTime",
    "tableOrCounter",
    "serviceMode",
  ];

  for (const key of requiredStringKeys) {
    if (typeof raw[key] !== "string" || !String(raw[key]).trim().length) {
      return { payload: null, error: `Missing or invalid field: ${String(key)}` };
    }
  }

  if (typeof raw.orderNumber !== "number" || !Number.isFinite(raw.orderNumber)) {
    return { payload: null, error: "Missing or invalid field: orderNumber" };
  }

  if (!Array.isArray(raw.items) || raw.items.length === 0) {
    return { payload: null, error: "Missing or invalid field: items" };
  }

  for (const [index, item] of raw.items.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { payload: null, error: `Invalid item at index ${index}` };
    }

    const typed = item as Record<string, unknown>;

    if (typeof typed.quantity !== "number" || !Number.isFinite(typed.quantity)) {
      return { payload: null, error: `Invalid item.quantity at index ${index}` };
    }

    if (typeof typed.itemName !== "string") {
      return { payload: null, error: `Invalid item.itemName at index ${index}` };
    }

    if (typeof typed.observation !== "string") {
      return { payload: null, error: `Invalid item.observation at index ${index}` };
    }
  }

  return { payload: raw as unknown as LocalPrintPayload, error: null };
};

const sendToTcpPrinter = async (payload: Buffer): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host: printerHost, port: printerPort });

    socket.on("connect", () => {
      socket.end(payload);
    });

    socket.on("error", (error) => {
      reject(error);
    });

    socket.on("close", (hasError) => {
      if (hasError) {
        reject(new Error("Socket closed due to connection error"));
        return;
      }
      resolve();
    });
  });
};

const spoolMockTicket = async (payload: Buffer, eventId: string): Promise<string> => {
  await mkdir(spoolDirectory, { recursive: true });

  const fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${eventId}.txt`;
  const filePath = path.join(spoolDirectory, fileName);

  await writeFile(filePath, payload);
  return filePath;
};

const server = Bun.serve({
  hostname: host,
  port,
  fetch: async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: jsonHeaders });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({
        ok: true,
        transport,
        host,
        port,
        defaultProfile,
        printerTarget: transport === "tcp" ? `${printerHost}:${printerPort}` : null,
      });
    }

    if (request.method === "POST" && url.pathname === "/print") {
      try {
        const rawBody = (await request.json()) as unknown;
        const { payload, error } = validatePayload(rawBody);

        if (!payload || error) {
          return jsonResponse({ ok: false, error: error ?? "Invalid payload" }, 400);
        }

        const resolvedProfile = resolvePrintProfile(payload.printerProfile ?? defaultProfile);
        const ticket = formatOrderTicket(payload, { profile: resolvedProfile });
        const binary = Buffer.concat([Buffer.from(ticket, "utf8"), cutCommand]);

        let target: string | null = null;
        if (transport === "tcp") {
          await sendToTcpPrinter(binary);
          target = `${printerHost}:${printerPort}`;
        } else {
          target = await spoolMockTicket(binary, payload.eventId);
        }

        return jsonResponse({
          ok: true,
          eventId: payload.eventId,
          profile: resolvedProfile,
          bytes: binary.byteLength,
          target,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected local print error";
        return jsonResponse({ ok: false, error: message }, 500);
      }
    }

    return jsonResponse({ ok: false, error: "Not found" }, 404);
  },
});

console.log(
  `[print-agent] online on http://${host}:${port} (transport=${transport}, defaultProfile=${defaultProfile})`
);
console.log(`[print-agent] server id: ${server.id}`);


