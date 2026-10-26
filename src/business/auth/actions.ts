'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function signIn(formData: FormData): Promise<{ success: true } | { success: false; code: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') || ''),
    password: String(formData.get('password') || ''),
  })

  if (error) return { success: false, code: error.code ?? 'unknown' }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: String(formData.get('email') || ''),
    password: String(formData.get('password') || ''),
  })

  if (error) redirect('/error?code=account-creation')
  revalidatePath('/', 'layout')
  redirect('/register/restaurant')
}

export async function requestPasswordRecovery(formData: FormData): Promise<
  { success: true } | { success: false; error: 'invalid-email' }
> {
  const email = String(formData.get('email') || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'invalid-email' }
  }

  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  if (!host) return { success: true }
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const redirectTo = `${protocol}://${host}/auth/callback?next=%2Freset-password`

  try {
    const supabase = await createClient()
    await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  } catch {
    // Keep provider failures indistinguishable from an unknown account.
  }

  return { success: true }
}
