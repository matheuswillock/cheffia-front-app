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

export function redirectWithRequestId(request: Request, location: string, status = 307) {
  return new Response(null, {
    status,
    headers: { Location: location, "X-Request-Id": getRequestId(request.headers) },
  })
}

// For responses built elsewhere (e.g. NextResponse.redirect) that must still carry the id.
export function withRequestId<T extends Response>(request: Request, response: T): T {
  response.headers.set("X-Request-Id", getRequestId(request.headers))
  return response
}
