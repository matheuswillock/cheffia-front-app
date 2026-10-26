import { afterEach, expect, mock, test } from "bun:test"

const signInWithPassword = mock(async () => ({ error: { code: "invalid_credentials", message: "provider internals" } }))
const signUp = mock(async () => ({ error: null }))
const createClient = mock(async () => ({ auth: { signInWithPassword, signUp } }))
const redirect = mock((path: string): never => { throw new Error(`redirect:${path}`) })
const revalidatePath = mock(() => undefined)

mock.module("@/utils/supabase/server", () => ({ createClient }))
mock.module("next/navigation", () => ({ redirect }))
mock.module("next/cache", () => ({ revalidatePath }))

const { signIn } = await import("@/business/auth/actions")

afterEach(() => {
  createClient.mockClear()
  signInWithPassword.mockClear()
  redirect.mockClear()
  revalidatePath.mockClear()
})

test("returns only the auth error code for invalid credentials instead of redirecting away", async () => {
  const formData = new FormData()
  formData.set("email", "person@example.com")
  formData.set("password", "wrong-password")

  await expect(signIn(formData)).resolves.toEqual({ success: false, code: "invalid_credentials" })
  expect(redirect).not.toHaveBeenCalled()
})
