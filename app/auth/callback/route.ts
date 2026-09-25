import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config'

// Links de email do Supabase (confirmação de cadastro e recuperação de senha) chegam aqui
// com ?code=...; trocamos pelo login e gravamos os cookies de sessão na resposta.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/dashboard'
  // Só caminhos internos (evita redirecionar para outro site)
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard'

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`)
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return response
  }

  // Link inválido ou expirado
  return NextResponse.redirect(`${origin}/login?message=verification-error`)
}
