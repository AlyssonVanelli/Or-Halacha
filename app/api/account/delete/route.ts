import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Exclusão da conta a pedido do titular (LGPD, art. 18).
// Cancela assinaturas no Stripe e apaga os dados pessoais. Registros de pagamento ficam
// no Stripe (obrigação legal/contábil), sem vínculo com a conta apagada.
export async function POST(req: Request) {
  try {
    const { user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { confirmation } = await req.json().catch(() => ({ confirmation: '' }))
    if (String(confirmation).trim().toUpperCase() !== 'EXCLUIR') {
      return NextResponse.json({ error: 'Digite EXCLUIR para confirmar.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    // 1. Cancela imediatamente qualquer assinatura ativa (para não haver novas cobranças)
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (stripeKey && profile?.stripe_customer_id) {
      const stripe = new Stripe(stripeKey, { apiVersion: '2025-04-30.basil' })
      try {
        const subs = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'all',
          limit: 20,
        })
        for (const sub of subs.data) {
          if (!['canceled', 'incomplete_expired'].includes(sub.status)) {
            await stripe.subscriptions.cancel(sub.id)
          }
        }
      } catch (err) {
        if ((err as { code?: string }).code !== 'resource_missing') throw err
      }
    }

    // 2. Apaga os dados do usuário (filhos primeiro)
    for (const table of ['favorites', 'data_consents', 'purchased_books', 'subscriptions']) {
      const { error } = await admin.from(table).delete().eq('user_id', user.id)
      if (error) console.error(`Exclusão de conta: erro em ${table}`, error.message)
    }
    // Pedidos de suporte ficam, mas sem vínculo com a pessoa
    await admin.from('support_requests').update({ user_id: null }).eq('user_id', user.id)

    // Foto de perfil
    if (profile?.avatar_url) {
      const file = profile.avatar_url.split('/').pop()?.split('?')[0]
      if (file) await admin.storage.from('avatars').remove([file])
    }

    await admin.from('profiles').delete().eq('id', user.id)

    // 3. Remove o login
    const { error: authError } = await admin.auth.admin.deleteUser(user.id)
    if (authError) {
      console.error('Exclusão de conta: erro ao remover usuário do Auth', authError.message)
      return NextResponse.json(
        { error: 'Não foi possível concluir a exclusão. Fale com o suporte.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na exclusão de conta:', error)
    return NextResponse.json(
      { error: 'Não foi possível concluir a exclusão. Fale com o suporte.' },
      { status: 500 }
    )
  }
}
