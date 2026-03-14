import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const getEncryptionKey = (): Buffer => {
  const secret = process.env.ASAAS_SUBACCOUNT_API_KEY_ENCRYPTION_SECRET?.trim() ?? "";
  if (!secret) {
    throw new Error("Missing ASAAS_SUBACCOUNT_API_KEY_ENCRYPTION_SECRET environment variable.");
  }

  return createHash("sha256").update(secret, "utf8").digest();
};

export const encryptSecret = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Cannot encrypt an empty secret.");
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
};

export const decryptSecret = (value: string): string => {
  const [version, ivRaw, tagRaw, encryptedRaw] = value.split(":");
  if (version !== "v1" || !ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Unsupported encrypted secret format.");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivRaw, "base64url");
  const tag = Buffer.from(tagRaw, "base64url");
  const encrypted = Buffer.from(encryptedRaw, "base64url");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};
