import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Schema de validação
const requestSchema = z.object({
  name: z.string().trim().max(200).optional().default(''),
  email: z.string().trim().email('Email inválido').max(320),
  subject: z
    .string()
    .max(200)
    .optional()
    .default('Suporte')
    .transform(s => s.replace(/[\r\n]+/g, ' ')),
  message: z.string().trim().min(10, 'A mensagem deve ter pelo menos 10 caracteres').max(5000),
})

function smtpConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_TO
  )
}

export async function POST(request: Request) {
  let data: z.infer<typeof requestSchema>
  try {
    data = requestSchema.parse(await request.json())
  } catch (error) {
    const message = error instanceof z.ZodError ? error.errors[0]?.message : 'Dados inválidos'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    // user_id e email vêm da sessão (se logado), nunca do corpo da requisição
    const { user } = await getAuthenticatedUser()
    const email = user?.email || data.email
    const name = data.name || (user?.user_metadata?.['full_name'] as string) || email.split('@')[0]

    const { error: dbError } = await createAdminClient()
      .from('support_requests')
      .insert([
        { name, email, subject: data.subject, message: data.message, user_id: user?.id ?? null },
      ])
    if (dbError) throw dbError

    // O pedido já está salvo; o e-mail de aviso é uma tentativa que não derruba a resposta
    if (smtpConfigured()) {
      try {
        await nodemailer
          .createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          })
          .sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.SMTP_TO,
            replyTo: email,
            subject: `Suporte Or Halachá: ${data.subject}`,
            text: `Nome: ${name}\nEmail: ${email}\nConta: ${user?.id ?? 'visitante'}\n\n${data.message}`,
          })
      } catch (mailError) {
        console.error('Suporte: pedido salvo, mas o e-mail de aviso falhou', mailError)
      }
    } else {
      console.warn('Suporte: SMTP não configurado; pedido salvo apenas no banco')
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao salvar pedido de suporte:', error)
    return NextResponse.json({ error: 'Erro ao processar solicitação de suporte' }, { status: 500 })
  }
}
