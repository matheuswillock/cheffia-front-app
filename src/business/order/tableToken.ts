import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const tableIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type TableTokenPayload = {
  version: 1
  tableId: string
  nonce: string
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url")
}

export function createTableToken(tableId: string, secret: string, nonce = randomBytes(16).toString("hex")) {
  if (!tableIdPattern.test(tableId) || !secret) {
    throw new Error("A valid table id and signing secret are required")
  }

  const payload = Buffer.from(JSON.stringify({ version: 1, tableId, nonce })).toString("base64url")
  const unsignedToken = `v1.${payload}`

  return `${unsignedToken}.${sign(unsignedToken, secret)}`
}

export function verifyTableToken(token: string, secret: string): TableTokenPayload | null {
  if (!secret) {
    return null
  }

  const [version, encodedPayload, signature, extra] = token.split(".")
  if (version !== "v1" || !encodedPayload || !signature || extra) {
    return null
  }

  const expectedSignature = sign(`${version}.${encodedPayload}`, secret)
  const actualBytes = Buffer.from(signature)
  const expectedBytes = Buffer.from(expectedSignature)
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<TableTokenPayload>
    if (
      parsed.version !== 1 ||
      typeof parsed.tableId !== "string" ||
      !tableIdPattern.test(parsed.tableId) ||
      typeof parsed.nonce !== "string" ||
      parsed.nonce.length < 8 ||
      parsed.nonce.length > 128
    ) {
      return null
    }

    return {
      version: 1,
      tableId: parsed.tableId,
      nonce: parsed.nonce,
    }
  } catch {
    return null
  }
}

export function hashTableToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url")
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}
