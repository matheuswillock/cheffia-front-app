#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_KEYS = ["DATABASE_URL", "DIRECT_URL"];
const OPTIONAL_KEYS = ["SUPABASE_DB_PASSWORD"];
const ENV_FILES = [".env", ".env.development", ".env.local", ".env.production"];
const PLACEHOLDER_PATTERNS = [
  /\[YOUR-PASSWORD\]/i,
  /<<[^>]+>>/,
  /replace_me/i,
  /placeholder/i,
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");

const stripQuotes = (value) => {
  if (value.length < 2) return value;
  const startsWithQuote = value.startsWith('"') || value.startsWith("'");
  const endsWithQuote = value.endsWith('"') || value.endsWith("'");
  return startsWithQuote && endsWithQuote ? value.slice(1, -1) : value;
};

const parseEnvFile = (content) => {
  const values = new Map();

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    values.set(key, stripQuotes(rawValue.trim()));
  }

  return values;
};

const fileExists = async (target) => {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
};

const loadFileSources = async () => {
  const sources = [];

  for (const fileName of ENV_FILES) {
    const fullPath = path.join(rootDir, fileName);
    if (!(await fileExists(fullPath))) continue;

    const content = await readFile(fullPath, "utf8");
    sources.push({
      source: fileName,
      values: parseEnvFile(content),
    });
  }

  const processEnvValues = new Map();
  for (const key of [...REQUIRED_KEYS, ...OPTIONAL_KEYS]) {
    if (!process.env[key]?.trim()) continue;
    processEnvValues.set(key, process.env[key].trim());
  }

  if (processEnvValues.size > 0) {
    sources.push({
      source: "process.env",
      values: processEnvValues,
    });
  }

  return sources;
};

const unique = (values) => Array.from(new Set(values));

const selectResolvedValue = (sources, key) => {
  const entries = sources
    .map((entry) => ({
      source: entry.source,
      value: entry.values.get(key),
    }))
    .filter((entry) => entry.value);

  return entries.length > 0 ? entries.at(-1) : null;
};

const main = async () => {
  const sources = await loadFileSources();
  const errors = [];
  const warnings = [];

  if (sources.length === 0) {
    errors.push("Nenhuma fonte de env encontrada (.env*, process.env).");
  }

  for (const key of REQUIRED_KEYS) {
    const occurrences = sources
      .map((entry) => ({
        source: entry.source,
        value: entry.values.get(key),
      }))
      .filter((entry) => entry.value);

    if (occurrences.length === 0) {
      errors.push(`${key} ausente em todas as fontes avaliadas.`);
      continue;
    }

    const fileValues = occurrences
      .filter((entry) => entry.source !== "process.env")
      .map((entry) => entry.value);

    if (unique(fileValues).length > 1) {
      const conflictingSources = occurrences
        .filter((entry) => entry.source !== "process.env")
        .map((entry) => entry.source)
        .join(", ");
      errors.push(`${key} possui valores conflitantes entre arquivos locais: ${conflictingSources}.`);
    }

    const resolved = selectResolvedValue(sources, key);
    if (!resolved) continue;

    if (!/^postgres(?:ql)?:\/\//i.test(resolved.value)) {
      errors.push(`${key} nao parece ser uma URL Postgres valida.`);
    }

    if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(resolved.value))) {
      errors.push(`${key} ainda contem placeholder e precisa ser normalizada.`);
    }

    if (key === "DATABASE_URL" && !resolved.value.includes(":6543/")) {
      warnings.push("DATABASE_URL nao aponta para a porta 6543 do pooler Supabase.");
    }

    if (key === "DIRECT_URL" && !resolved.value.includes(":5432/")) {
      warnings.push("DIRECT_URL nao aponta para a porta 5432 de conexao direta.");
    }
  }

  const resolvedPassword = selectResolvedValue(sources, "SUPABASE_DB_PASSWORD");
  if (!resolvedPassword) {
    warnings.push("SUPABASE_DB_PASSWORD nao foi encontrado. Isso e aceitavel apenas se DATABASE_URL/DIRECT_URL ja estiverem completos.");
  }

  if (errors.length > 0) {
    console.error("[prisma:env:check] Falhou.");
    for (const error of errors) {
      console.error(`[prisma:env:check] ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `[prisma:env:check] Fontes avaliadas: ${sources.map((entry) => entry.source).join(", ")}.`
  );
  console.log("[prisma:env:check] DATABASE_URL e DIRECT_URL presentes e sem placeholders detectados.");

  for (const warning of warnings) {
    console.warn(`[prisma:env:check] Aviso: ${warning}`);
  }
};

void main();
