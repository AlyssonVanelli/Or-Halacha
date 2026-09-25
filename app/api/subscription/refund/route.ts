import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refundAndCancelSubscription } from '@/lib/stripe'

export async function POST() {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar assinatura do usuário
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subError || !subscription?.subscription_id) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    // Verificar se está dentro do prazo de 7 dias
    const subscriptionDate = new Date(subscription.created_at)
    const daysDifference = Math.floor(
      (Date.now() - subscriptionDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysDifference > 7) {
      return NextResponse.json(
        {
          error:
            'Prazo para reembolso expirado. Reembolsos são permitidos apenas até 7 dias após a compra.',
          daysSincePurchase: daysDifference,
        },
        { status: 400 }
      )
    }

    const refund = await refundAndCancelSubscription(subscription.subscription_id)

    // Atualizar status no banco (service role: usuário não tem permissão de escrita via RLS)
    const { error: updateError } = await createAdminClient()
      .from('subscriptions')
      .update({
        status: 'canceled',
        explicacao_pratica: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      // O webhook customer.subscription.deleted também atualiza o status
      console.error('Erro ao atualizar assinatura após reembolso:', updateError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Reembolso processado com sucesso. O valor será estornado em até 5-10 dias úteis.',
      refundId: refund.id,
      amount: refund.amount,
    })
  } catch (error) {
    console.error('Erro ao processar reembolso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
