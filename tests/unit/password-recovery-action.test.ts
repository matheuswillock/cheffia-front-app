import { afterEach, expect, mock, test } from 'bun:test'

const resetPasswordForEmail = mock(async (): Promise<{ error: { message: string } | null }> => ({ error: null }))
const createClient = mock(async () => ({ auth: { resetPasswordForEmail } }))
const headers = mock(async () => new Headers({ host: 'cheffia.test', 'x-forwarded-proto': 'https' }))

mock.module('@/utils/supabase/server', () => ({ createClient }))
mock.module('next/headers', () => ({ headers }))

const { requestPasswordRecovery } = await import('@/business/auth/actions')

afterEach(() => {
  createClient.mockClear()
  resetPasswordForEmail.mockClear()
})

test('requests recovery using the app callback and returns a generic success result', async () => {
  const formData = new FormData()
  formData.set('email', 'person@example.com')

  await expect(requestPasswordRecovery(formData)).resolves.toEqual({ success: true })
  expect(resetPasswordForEmail).toHaveBeenCalledWith('person@example.com', {
    redirectTo: 'https://cheffia.test/auth/callback?next=%2Freset-password',
  })
})

test('rejects invalid email without contacting Supabase', async () => {
  const formData = new FormData()
  formData.set('email', 'not-an-email')

  await expect(requestPasswordRecovery(formData)).resolves.toEqual({ success: false, error: 'invalid-email' })
  expect(createClient).not.toHaveBeenCalled()
  expect(resetPasswordForEmail).not.toHaveBeenCalled()
})

test('returns the same safe success result when Supabase reports an error', async () => {
  resetPasswordForEmail.mockResolvedValueOnce({ error: { message: 'user not found' } })
  const formData = new FormData()
  formData.set('email', 'person@example.com')

  await expect(requestPasswordRecovery(formData)).resolves.toEqual({ success: true })
})
