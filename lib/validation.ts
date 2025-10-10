import { z } from 'zod'
import { logSQLInjectionAttempt, logXSSAttempt } from './security-monitor'

/**
 * Schemas de validação para APIs
 */

// Schema para busca
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Query é obrigatória')
    .max(100, 'Query muito longa')
    .refine(val => !/<script/i.test(val), 'Conteúdo suspeito detectado')
    .refine(val => !/union\s+select/i.test(val), 'Tentativa de SQL injection detectada')
    .refine(val => !/drop\s+table/i.test(val), 'Tentativa de SQL injection detectada'),
  limit: z.number().min(1).max(50).default(10),
  offset: z.number().min(0).default(0),
})

// Schema para autenticação
export const authSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(254, 'Email muito longo')
    .refine(val => !/<script/i.test(val), 'Conteúdo suspeito detectado'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha muito longa')
    .refine(
      val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val),
      'Senha deve conter maiúscula, minúscula e número'
    ),
})

// Schema para criação de conteúdo
export const contentSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título muito longo')
    .refine(val => !/<script/i.test(val), 'Conteúdo suspeito detectado'),
  content: z
    .string()
    .min(1, 'Conteúdo é obrigatório')
    .max(10000, 'Conteúdo muito longo')
    .refine(val => !/<script/i.test(val), 'Conteúdo suspeito detectado')
    .refine(val => !/union\s+select/i.test(val), 'Tentativa de SQL injection detectada'),
  bookId: z.string().uuid('ID do livro inválido'),
  chapterId: z.string().uuid('ID do capítulo inválido').optional(),
})

// Schema para suporte
export const supportSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo')
    .refine(val => !/<script/i.test(val), 'Conteúdo suspeito detectado'),
  email: z.string().email('Email inválido').max(254, 'Email muito longo'),
  subject: z
    .string()
    .min(1, 'Assunto é obrigatório')
    .max(200, 'Assunto muito longo')
    .refine(val => !/<script/i.test(val), 'Conteúdo suspeito detectado'),
  message: z
    .string()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(2000, 'Mensagem muito longa')
    .refine(val => !/<script/i.test(val), 'Conteúdo suspeito detectado'),
})

/**
 * Validador com logging de segurança
 */
export function validateWithSecurity<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  ip: string,
  userAgent: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]

      // Log tentativas de ataque
      if (firstError.message.includes('suspeito') || firstError.message.includes('injection')) {
        if (firstError.message.includes('script')) {
          logXSSAttempt(ip, userAgent, JSON.stringify(data))
        } else if (firstError.message.includes('injection')) {
          logSQLInjectionAttempt(ip, userAgent, JSON.stringify(data))
        }
      }

      return { success: false, error: firstError.message }
    }

    return { success: false, error: 'Erro de validação' }
  }
}

/**
 * Sanitiza string removendo caracteres perigosos
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/union\s+select/gi, '')
    .replace(/drop\s+table/gi, '')
    .replace(/exec\s*\(/gi, '')
    .trim()
}

/**
 * Valida se string contém apenas caracteres seguros
 */
export function isSafeString(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /exec\s*\(/i,
    /\.\.\//i,
  ]

  return !dangerousPatterns.some(pattern => pattern.test(input))
}
