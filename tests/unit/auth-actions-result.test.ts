import { afterEach, expect, mock, test } from "bun:test"

type AuthError = { code?: string; message: string }
const signInWithPassword = mock(async (): Promise<{ error: AuthError | null }> => ({ error: { code: "invalid_credentials", message: "provider internals" } }))
const signUp = mock(async (): Promise<{ error: AuthError | null }> => ({ error: null }))
const resetPasswordForEmail = mock(async () => undefined)
const createClient = mock(async () => ({ auth: { signInWithPassword, signUp, resetPasswordForEmail } }))
const redirect = mock((path: string): never => { throw new Error(`redirect:${path}`) })
const revalidatePath = mock(() => undefined)
const headers = mock(async () => new Headers({ host: "app.example.com", "x-forwarded-proto": "https" }))

mock.module("@/utils/supabase/server", () => ({ createClient }))
mock.module("next/navigation", () => ({ redirect }))
mock.module("next/cache", () => ({ revalidatePath }))
mock.module("next/headers", () => ({ headers }))

const { requestPasswordRecovery, signIn, signUp: register } = await import("@/business/auth/actions")

afterEach(() => {
  createClient.mockClear()
  signInWithPassword.mockClear()
  redirect.mockClear()
  revalidatePath.mockClear()
  resetPasswordForEmail.mockClear()
  headers.mockClear()
})

test("returns only the auth error code for invalid credentials instead of redirecting away", async () => {
  const formData = new FormData()
  formData.set("email", "person@example.com")
  formData.set("password", "wrong-password")

  await expect(signIn(formData)).resolves.toEqual({ success: false, code: "invalid_credentials" })
  expect(redirect).not.toHaveBeenCalled()
})

test("redirects after a successful sign-in and revalidates the layout", async () => {
  signInWithPassword.mockImplementation(async () => ({ error: null }))
  const formData = new FormData()
  formData.set("email", "person@example.com")
  formData.set("password", "correct-password")

  await expect(signIn(formData)).rejects.toThrow("redirect:/dashboard")
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout")
})

test("redirects sign-up provider failures to the account error page", async () => {
  signUp.mockImplementation(async () => ({ error: { message: "already registered" } }))
  const formData = new FormData()
  formData.set("email", "person@example.com")
  formData.set("password", "password")

  await expect(register(formData)).rejects.toThrow("redirect:/error?code=account-creation")
})

test("redirects after a successful sign-up", async () => {
  signUp.mockImplementation(async () => ({ error: null }))
  const formData = new FormData()
  formData.set("email", "person@example.com")
  formData.set("password", "password")

  await expect(register(formData)).rejects.toThrow("redirect:/register/restaurant")
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout")
})

test("rejects malformed recovery emails before creating a provider client", async () => {
  const formData = new FormData()
  formData.set("email", "not-an-email")

  await expect(requestPasswordRecovery(formData)).resolves.toEqual({ success: false, error: "invalid-email" })
  expect(createClient).not.toHaveBeenCalled()
})

test("requests recovery with the forwarded host and protocol", async () => {
  const formData = new FormData()
  formData.set("email", "person@example.com")

  await expect(requestPasswordRecovery(formData)).resolves.toEqual({ success: true })
  expect(resetPasswordForEmail).toHaveBeenCalledWith("person@example.com", {
    redirectTo: "https://app.example.com/auth/callback?next=%2Freset-password",
  })
})
