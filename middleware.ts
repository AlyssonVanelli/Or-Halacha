import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config'
import { logSuspiciousRequest, securityMonitor } from '@/lib/security-monitor'

// Obs.: rate limiting não é feito aqui. Um Map em memória não funciona em ambiente
// serverless/edge (cada instância tem o seu). Use o rate limit da Vercel (Firewall) ou
// Upstash Redis se necessário.

// Não bloqueamos por user-agent: é trivial de falsificar, derrubava o Googlebot (SEO) e
// quebrava integrações legítimas (cron via curl). A proteção real é a autenticação nas rotas.

const MALICIOUS_PATTERNS = [
  /\.\.\//, // Path traversal
  /<script/i, // XSS attempts
  /union\s+select/i, // SQL injection
  /drop\s+table/i, // SQL injection
]

const addSecurityHeaders = (response: NextResponse) => {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  return response
}

const getClientIp = (req: NextRequest) =>
  req.headers.get('x-real-ip') ||
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  'unknown'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = getClientIp(req)
  const userAgent = req.headers.get('user-agent') || ''
  const isApi = pathname.startsWith('/api/')

  if (securityMonitor.isIPBlocked(ip)) {
    return new NextResponse('Access denied', { status: 403 })
  }

  let decodedUrl = req.url
  try {
    decodedUrl = decodeURIComponent(req.url)
  } catch {
    // URL mal codificada: segue com o valor bruto
  }
  if (MALICIOUS_PATTERNS.some(p => p.test(decodedUrl))) {
    logSuspiciousRequest(ip, userAgent, pathname)
    return new NextResponse('Suspicious request detected', { status: 400 })
  }

  // APIs e webhook fazem a própria autenticação; não precisam de refresh de sessão aqui
  if (isApi) {
    return addSecurityHeaders(NextResponse.next())
  }

  let res = NextResponse.next({ request: req })

  // Supabase: atualiza os cookies de sessão
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })

  // getUser() valida o JWT no servidor do Supabase (getSession() não valida)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return addSecurityHeaders(res)
}

export const config = {
  matcher: [
    // Tudo, exceto assets estáticos e a página de rate-limit
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|rate-limit|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
}
