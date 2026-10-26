import { expect, test } from "bun:test"
import { createHmac } from "node:crypto"

import {
  createTableToken,
  createSessionToken,
  hashSessionToken,
  hashTableToken,
  verifyTableToken,
} from "@/business/order/tableToken"

const tableId = "00000000-0000-0000-0000-000000000001"
const secret = "test-only-table-secret"

test("table token round trips and has a non-reversible database hash", () => {
  const token = createTableToken(tableId, secret, "fixed-nonce")
  const payload = verifyTableToken(token, secret)

  expect(payload).toEqual({ version: 1, tableId, nonce: "fixed-nonce" })
  expect(hashTableToken(token)).not.toBe(token)
})

test("table token rejects tampering and a different signing secret", () => {
  const token = createTableToken(tableId, secret, "fixed-nonce")
  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`

  expect(verifyTableToken(tampered, secret)).toBeNull()
  expect(verifyTableToken(token, "another-secret")).toBeNull()
})

test("table token rejects invalid identifiers, malformed payloads, and missing secrets", () => {
  expect(() => createTableToken("not-a-uuid", secret, "fixed-nonce")).toThrow()
  expect(() => createTableToken(tableId, "", "fixed-nonce")).toThrow()
  expect(verifyTableToken("", secret)).toBeNull()
  expect(verifyTableToken("v1.invalid", secret)).toBeNull()
  expect(verifyTableToken("v2.payload.signature", secret)).toBeNull()
  expect(verifyTableToken(createTableToken(tableId, secret, "x"), "")).toBeNull()
})

test("table token rejects nonce values outside the allowed bounds", () => {
  expect(verifyTableToken(createTableToken(tableId, secret, "short"), secret)).toBeNull()
  expect(verifyTableToken(createTableToken(tableId, secret, "x".repeat(129)), secret)).toBeNull()
})

test("table token rejects a signed payload that is not valid JSON", () => {
  const encodedPayload = Buffer.from("{").toString("base64url")
  const unsignedToken = `v1.${encodedPayload}`
  const signature = createHmac("sha256", secret).update(unsignedToken).digest("base64url")

  expect(verifyTableToken(`${unsignedToken}.${signature}`, secret)).toBeNull()
})

test("session tokens are random bearer values stored only as hashes", () => {
  const first = createSessionToken()
  const second = createSessionToken()

  expect(first).not.toBe(second)
  expect(first.length).toBeGreaterThanOrEqual(32)
  expect(hashSessionToken(first)).not.toBe(first)
})
