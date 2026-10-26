import { afterEach, expect, mock, test } from "bun:test"

const updateUser = mock(async () => ({ error: null }))
const createClient = mock(async () => ({ auth: { updateUser } }))

mock.module("@/utils/supabase/server", () => ({ createClient }))

const { updatePassword } = await import("@/business/auth/password-actions")

afterEach(() => {
  createClient.mockClear()
  updateUser.mockClear()
})

test("updates the authenticated user's password after validation", async () => {
  const formData = new FormData()
  formData.set("password", "SenhaSegura1!")
  formData.set("confirmPassword", "SenhaSegura1!")

  await expect(updatePassword(formData)).resolves.toEqual({ success: true })
  expect(updateUser).toHaveBeenCalledWith({ password: "SenhaSegura1!" })
})

test("rejects a weak or mismatched password without calling Supabase", async () => {
  const formData = new FormData()
  formData.set("password", "weak")
  formData.set("confirmPassword", "different")

  await expect(updatePassword(formData)).resolves.toMatchObject({ success: false, error: "invalid-password" })
  expect(createClient).not.toHaveBeenCalled()
  expect(updateUser).not.toHaveBeenCalled()
})

test("returns a safe failure when the reset session is invalid", async () => {
  updateUser.mockResolvedValueOnce({ error: { message: "invalid recovery token" } } as never)
  const formData = new FormData()
  formData.set("password", "SenhaSegura1!")
  formData.set("confirmPassword", "SenhaSegura1!")

  await expect(updatePassword(formData)).resolves.toEqual({ success: false, error: "invalid-or-expired-link" })
})

test("returns a safe failure when the auth client cannot be created", async () => {
  createClient.mockRejectedValueOnce(new Error("session unavailable"))
  const formData = new FormData()
  formData.set("password", "SenhaSegura1!")
  formData.set("confirmPassword", "SenhaSegura1!")

  await expect(updatePassword(formData)).resolves.toEqual({ success: false, error: "invalid-or-expired-link" })
})
