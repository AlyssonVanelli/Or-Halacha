import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Retorna o usuário autenticado a partir do cookie de sessão, validando o JWT no Supabase.
// Nunca confiar em userId enviado no corpo da requisição.
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export const unauthorizedResponse = () =>
  NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

export function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.or-halacha.com.br').replace(/\/$/, '')
}

// Aceita URLs de retorno apenas do próprio site (evita redirecionar o usuário para outro domínio
// após o checkout).
export function safeReturnUrl(value: unknown, req: Request, fallbackPath: string) {
  const allowedOrigins = new Set([new URL(req.url).origin, getBaseUrl()])
  try {
    const url = new URL(String(value))
    if (allowedOrigins.has(url.origin)) return url.toString()
  } catch {
    // valor ausente ou inválido
  }
  return `${getBaseUrl()}${fallbackPath}`
}
