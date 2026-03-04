#!/usr/bin/env node

const DEFAULT_PATH = "/api/v1/cheffia/OrderHub/webhook/asaas";
const NGROK_API_URL = process.env.NGROK_API_URL || "http://127.0.0.1:4040/api/tunnels";

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

function normalizePath(inputPath) {
  if (!inputPath) return DEFAULT_PATH;
  return inputPath.startsWith("/") ? inputPath : `/${inputPath}`;
}

async function main() {
  const fromArg = getArgValue("--path");
  const fromEnv = process.env.WEBHOOK_PATH;
  const webhookPath = normalizePath(fromArg || fromEnv || DEFAULT_PATH);

  let response;
  try {
    response = await fetch(NGROK_API_URL);
  } catch (error) {
    console.error(`[ngrok:webhook:url] Nao foi possivel acessar a API local do ngrok em ${NGROK_API_URL}.`);
    console.error("[ngrok:webhook:url] Inicie o tunel antes: bun run ngrok:webhook");
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`[ngrok:webhook:url] API do ngrok respondeu com status ${response.status}.`);
    process.exit(1);
  }

  const payload = await response.json();
  const tunnels = Array.isArray(payload?.tunnels) ? payload.tunnels : [];
  const httpsTunnel = tunnels.find((tunnel) => typeof tunnel?.public_url === "string" && tunnel.public_url.startsWith("https://"));

  if (!httpsTunnel) {
    console.error("[ngrok:webhook:url] Nenhum tunel HTTPS ativo encontrado.");
    console.error("[ngrok:webhook:url] Inicie: bun run ngrok:webhook");
    process.exit(1);
  }

  const baseUrl = httpsTunnel.public_url.replace(/\/$/, "");
  const webhookUrl = `${baseUrl}${webhookPath}`;

  console.log(webhookUrl);
}

main();
