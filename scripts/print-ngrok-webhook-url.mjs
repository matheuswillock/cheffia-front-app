#!/usr/bin/env node

import { pathToFileURL } from "node:url";

export const DEFAULT_PATH = "/api/v1/cheffia/OrderHub/webhook/asaas";
export const NGROK_API_URL =
  process.env.NGROK_API_URL || "http://127.0.0.1:4040/api/tunnels";

export function getArgValue(flag, args = process.argv) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

export function normalizePath(inputPath) {
  if (!inputPath) return DEFAULT_PATH;
  return inputPath.startsWith("/") ? inputPath : `/${inputPath}`;
}

export async function getNgrokHttpsBaseUrl(apiUrl = NGROK_API_URL) {
  let response;
  try {
    response = await fetch(apiUrl);
  } catch {
    throw new Error(
      `[ngrok:webhook:url] Nao foi possivel acessar a API local do ngrok em ${apiUrl}.`
    );
  }

  if (!response.ok) {
    throw new Error(
      `[ngrok:webhook:url] API do ngrok respondeu com status ${response.status}.`
    );
  }

  const payload = await response.json();
  const tunnels = Array.isArray(payload?.tunnels) ? payload.tunnels : [];
  const httpsTunnel = tunnels.find(
    (tunnel) =>
      typeof tunnel?.public_url === "string" && tunnel.public_url.startsWith("https://")
  );

  if (!httpsTunnel) {
    throw new Error("[ngrok:webhook:url] Nenhum tunel HTTPS ativo encontrado.");
  }

  return httpsTunnel.public_url.replace(/\/$/, "");
}

export async function resolveNgrokWebhookUrl({
  apiUrl = NGROK_API_URL,
  webhookPath = DEFAULT_PATH,
} = {}) {
  const baseUrl = await getNgrokHttpsBaseUrl(apiUrl);
  return `${baseUrl}${normalizePath(webhookPath)}`;
}

async function main() {
  const fromArg = getArgValue("--path");
  const fromEnv = process.env.WEBHOOK_PATH;
  const webhookPath = normalizePath(fromArg || fromEnv || DEFAULT_PATH);

  try {
    const webhookUrl = await resolveNgrokWebhookUrl({ webhookPath });
    console.log(webhookUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    console.error("[ngrok:webhook:url] Inicie o tunel antes: bun run ngrok:webhook");
    process.exit(1);
  }
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main();
}
