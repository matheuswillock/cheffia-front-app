import { randomUUID } from "node:crypto"

const requestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/

export function getRequestId(headers: Headers) {
  const candidate = headers.get("X-Request-Id")?.trim()
  return candidate && requestIdPattern.test(candidate) ? candidate : randomUUID()
}

export function jsonWithRequestId(
  request: Request,
  body: unknown,
  init: ResponseInit = {},
) {
  const headers = new Headers(init.headers)
  headers.set("X-Request-Id", getRequestId(request.headers))
  return Response.json(body, { ...init, headers })
}
