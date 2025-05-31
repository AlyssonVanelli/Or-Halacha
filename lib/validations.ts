import { z } from 'zod'

// Esquema para validação de login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

// Esquema para validação de cadastro
export const signupSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(6, 'A senha deve ter no mínimo 6 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
})

// Esquema para validação de criação/edição de livro
export const bookSchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
  slug: z.string().min(3, 'O slug deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres'),
  author: z.string().min(3, 'O nome do autor deve ter no mínimo 3 caracteres'),
  is_published: z.boolean(),
})

// Esquema para validação de criação/edição de capítulo
export const chapterSchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
  slug: z.string().min(3, 'O slug deve ter no mínimo 3 caracteres'),
  position: z.number().min(1, 'A posição deve ser maior que 0'),
  content: z.string().min(10, 'O conteúdo deve ter no mínimo 10 caracteres'),
  is_published: z.boolean(),
})

// Esquema para validação de assinatura
export const subscriptionSchema = z.object({
  priceId: z.string().min(1, 'ID do preço é obrigatório'),
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  successUrl: z.string().url('URL de sucesso inválida'),
  cancelUrl: z.string().url('URL de cancelamento inválida'),
})

// Esquema para validação de compra de livro
export const bookPurchaseSchema = z.object({
  bookId: z.string().min(1, 'ID do livro é obrigatório'),
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  priceId: z.string().min(1, 'ID do preço é obrigatório'),
  successUrl: z.string().url('URL de sucesso inválida'),
  cancelUrl: z.string().url('URL de cancelamento inválida'),
})
