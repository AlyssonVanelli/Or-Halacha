import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitiza HTML para prevenir XSS
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['br', 'p', 'strong', 'em', 'u', 'b', 'i'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Sanitiza texto simples
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>')
}

/**
 * Valida entrada de usuário
 */
export function validateInput(input: string, maxLength: number = 1000): boolean {
  if (!input || typeof input !== 'string') return false
  if (input.length > maxLength) return false

  // Bloqueia scripts e tags perigosas
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
  ]

  return !dangerousPatterns.some(pattern => pattern.test(input))
}

/**
 * Sanitiza e valida conteúdo para exibição
 */
export function safeHTML(content: string): string {
  if (!validateInput(content)) {
    return 'Conteúdo não permitido'
  }

  return sanitizeHTML(sanitizeText(content))
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Valida senha
 */
export function validatePassword(password: string): boolean {
  // Mínimo 8 caracteres, pelo menos 1 maiúscula, 1 minúscula, 1 número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password) && password.length <= 128
}

/**
 * Gera token CSRF seguro
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Valida token CSRF
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false
  return token === sessionToken
}

/**
 * Rate limiting por IP
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  ip: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000
): boolean {
  const now = Date.now()
  const key = ip
  const current = rateLimitMap.get(key)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= limit) {
    return false
  }

  current.count++
  return true
}

/**
 * Log de segurança
 */
export function logSecurityEvent(event: string, details: Record<string, unknown>, ip?: string) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    event,
    details,
    ip,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
  }

  // Em produção, enviar para serviço de logging
}
