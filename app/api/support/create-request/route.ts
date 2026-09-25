import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/api-auth'

// Schema de validação
const requestSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(200),
  email: z.string().email('Email inválido').max(320),
  subject: z
    .string()
    .max(200)
    .transform(s => s.replace(/[\r\n]+/g, ' ')),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres').max(5000),
})

const transporter = nodemailer.createTransport({
  host: process.env['SMTP_HOST'],
  port: Number(process.env['SMTP_PORT']),
  auth: {
    user: process.env['SMTP_USER'],
    pass: process.env['SMTP_PASS'],
  },
})

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
if (!supabaseUrl || !supabaseKey)
  throw new Error('Variáveis de ambiente do Supabase não configuradas')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    // user_id vem da sessão (se logado), nunca do corpo da requisição
    const { user } = await getAuthenticatedUser()

    // Salvar no Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { error: dbError } = await supabase
      .from('support_requests')
      .insert([{ ...validatedData, user_id: user?.id ?? null }])

    if (dbError) {
      throw dbError
    }

    // Enviar e-mail
    await transporter.sendMail({
      from: process.env['SMTP_FROM'],
      to: process.env['SMTP_TO'],
      subject: `Nova solicitação de suporte: ${validatedData.subject}`,
      text: `
        Nome: ${validatedData.name}
        Email: ${validatedData.email}
        Assunto: ${validatedData.subject}
        Mensagem: ${validatedData.message}
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar solicitação de suporte' }, { status: 500 })
  }
}
