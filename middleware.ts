import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config'
import { logRateLimitExceeded, logSuspiciousRequest, securityMonitor } from '@/lib/security-monitor'

// Rate limiting store (em produção usar Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // 100 requests por IP por janela
  apiMaxRequests: 20, // 20 requests para APIs por IP por janela
}

// Cleanup expired entries
const cleanupRateLimit = () => {
  const now = Date.now()
  rateLimitStore.forEach((value, key) => {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  })
}

// Rate limiting function
const checkRateLimit = (ip: string, isApi: boolean = false): boolean => {
  cleanupRateLimit()

  const key = `${ip}:${isApi ? 'api' : 'web'}`
  const now = Date.now()
  const windowStart = now - RATE_LIMIT.windowMs

  const current = rateLimitStore.get(key)
  const maxRequests = isApi ? RATE_LIMIT.apiMaxRequests : RATE_LIMIT.maxRequests

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

// Security headers
const addSecurityHeaders = (response: NextResponse) => {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  return response
}

export async function middleware(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || ''
  const isApi = req.nextUrl.pathname.startsWith('/api/')

  // Block suspicious user agents
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
  ]

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Rate limiting
  if (!checkRateLimit(ip, isApi)) {
    logRateLimitExceeded(ip, userAgent, req.nextUrl.pathname)
    return NextResponse.redirect(new URL('/rate-limit', req.url), {
      status: 302,
      headers: {
        'Retry-After': '900', // 15 minutos
        'X-RateLimit-Limit': isApi
          ? RATE_LIMIT.apiMaxRequests.toString()
          : RATE_LIMIT.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT.windowMs).toISOString(),
      },
    })
  }

  // Verificar se IP está bloqueado
  if (securityMonitor.isIPBlocked(ip)) {
    return new NextResponse('Access denied', { status: 403 })
  }

  // Detectar requisições suspeitas
  const maliciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /drop\s+table/i, // SQL injection
    /exec\s*\(/i, // Command injection
  ]

  const url = req.url
  if (maliciousPatterns.some(pattern => pattern.test(url))) {
    logSuspiciousRequest(ip, userAgent, req.nextUrl.pathname)
    return new NextResponse('Suspicious request detected', { status: 400 })
  }

  // Block requests to sensitive paths (exceto APIs públicas)
  const sensitivePaths = ['/_next/', '/admin/', '/dashboard/']
  const publicApiPaths = [
    '/api/test-stripe-config',
    '/api/test-stripe-connection',
    '/api/create-subscription-checkout',
    '/api/create-checkout-session',
    '/api/webhooks/stripe',
    '/api/debug-profile',
  ]

  if (sensitivePaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    // Additional validation for sensitive paths
    const authHeader = req.headers.get('authorization')
    if (!authHeader && req.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  // Permitir APIs públicas sem autenticação
  if (
    req.nextUrl.pathname.startsWith('/api/') &&
    publicApiPaths.some(path => req.nextUrl.pathname.startsWith(path))
  ) {
    // APIs públicas - não requer autenticação
  }

  let res = NextResponse.next()

  // Supabase authentication
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

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Exceções para páginas que não precisam de autenticação
  const publicPaths = ['/payment/success', '/payment/cancel', '/login', '/signup']
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))

  if (!session && req.nextUrl.pathname.startsWith('/dashboard') && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Add security headers
  res = addSecurityHeaders(res)

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/admin/:path*',
    '/_next/static/:path*',
    '/_next/image/:path*',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/((?!rate-limit).*)', // Excluir rate-limit do middleware para evitar loop
  ],
}
