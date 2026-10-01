import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { HOTMART_BUYER_AREA_URL } from '@/lib/plans'

// Exclusão da conta a pedido do titular (LGPD, art. 18). Apaga os dados pessoais do site;
// os registros de pagamento ficam na Hotmart (obrigação legal/contábil), sem vínculo com a conta.
export async function POST(req: Request) {
  try {
    const { user } = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { confirmation } = await req.json().catch(() => ({ confirmation: '' }))
    if (String(confirmation).trim().toUpperCase() !== 'EXCLUIR') {
      return NextResponse.json({ error: 'Digite EXCLUIR para confirmar.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // A renovação é cobrada pela Hotmart: sem cancelá-la lá, a pessoa continuaria pagando
    const { data: sub } = await admin
      .from('subscriptions')
      .select('status, cancel_at_period_end, provider')
      .eq('user_id', user.id)
      .maybeSingle()
    if (
      sub?.provider === 'hotmart' &&
      ['active', 'past_due'].includes(sub.status as string) &&
      !sub.cancel_at_period_end
    ) {
      return NextResponse.json(
        {
          error:
            'Sua assinatura ainda está com renovação automática. Cancele a renovação na área do comprador da Hotmart (Minhas compras → Or Halachá) e depois exclua a conta.',
          buyerAreaUrl: HOTMART_BUYER_AREA_URL,
        },
        { status: 409 }
      )
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    // Apaga os dados do usuário (filhos primeiro)
    for (const table of [
      'favorites',
      'data_consents',
      'purchased_books',
      'subscriptions',
      'payment_events',
    ]) {
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

    // Remove o login
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
