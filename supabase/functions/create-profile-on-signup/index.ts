// @ts-expect-error Deno types only available in edge runtime
// Este arquivo é exclusivo para Supabase Edge Functions (Deno). Ignore avisos do TypeScript do Node/Next.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  // Tenta ler o evento recebido
  let event
  try {
    event = await req.json()
  } catch (e) {
    return new Response('Evento inválido', { status: 400 })
  }

  // Verifica o tipo de evento (para compatibilidade com diferentes formatos)
  const { type } = event
  if (type && type !== 'INSERT' && type !== 'SIGNED_UP' && type !== 'USER_CREATED') {
    return new Response(`Ignorado: evento do tipo ${type} não é de criação de usuário.`, {
      status: 200,
    })
  }

  // Tenta pegar o usuário do evento (pode ser record, user, etc)
  const user = event.record || event.user || event.new || event
  if (!user || !user.id) {
    return new Response('Usuário não encontrado no evento', { status: 400 })
  }

  // Dados do usuário
  const userId = user.id
  const fullName = user.user_metadata?.full_name || ''

  // Chave Service Role para inserir no banco
  // @ts-expect-error Deno types only available in edge runtime
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  // @ts-expect-error Deno types only available in edge runtime
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response('Ambiente não configurado corretamente', { status: 500 })
  }

  // Insere o perfil na tabela 'profiles'
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      id: userId,
      full_name: fullName,
      created_at: new Date().toISOString(),
    }),
  })

  if (!resp.ok) {
    const error = await resp.text()
    return new Response('Erro ao criar perfil: ' + error, { status: 500 })
  }

  return new Response('Perfil criado com sucesso!', { status: 200 })
})
