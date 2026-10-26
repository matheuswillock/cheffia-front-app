'use client'

import { useSearchParams } from 'next/navigation'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const message = code === 'invalid-credentials'
    ? 'Não foi possível entrar. Confira seu email e senha.'
    : code === 'account-creation'
      ? 'Não foi possível criar sua conta. Confira os dados e tente novamente.'
      : 'Não foi possível concluir agora. Tente novamente.'

  return <main className="flex min-h-svh items-center justify-center bg-background-default px-6 text-center text-foreground-default"><p className="font-inter text-base">{message}</p></main>
}
