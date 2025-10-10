import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function GET() {
  return NextResponse.json({ message: 'API de reembolso funcionando' })
}

export async function POST(req: Request) {
  try {
    console.log('API /api/refund chamada')
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log('Usuário autenticado:', !!user, 'Erro:', userError)

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { refundType, subscriptionId, paymentIntentId } = await req.json()

    if (!refundType) {
      return NextResponse.json({ error: 'Tipo de reembolso é obrigatório' }, { status: 400 })
    }

    // Verificar se o usuário tem acesso ao que está tentando reembolsar
    if (refundType === 'subscription' && subscriptionId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', user.id)
        .single()

      if (!subscription) {
        return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
      }

      // Verificar se a assinatura foi criada há menos de 7 dias
      const subscriptionDate = new Date(subscription.created_at)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      if (subscriptionDate < sevenDaysAgo) {
        return NextResponse.json(
          { error: 'Período de reembolso expirado (7 dias)' },
          { status: 400 }
        )
      }

      // Cancelar assinatura no Stripe
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id)

      // Atualizar status no banco
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', cancel_reason: 'refund_requested' })
        .eq('id', subscriptionId)

      // Reembolsar pagamento se possível
      if (subscription.stripe_payment_intent_id) {
        try {
          await stripe.refunds.create({
            payment_intent: subscription.stripe_payment_intent_id,
            reason: 'requested_by_customer',
          })
        } catch (refundError) {
          console.error('Erro ao reembolsar pagamento:', refundError)
          // Continuar mesmo se o reembolso falhar
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Assinatura cancelada e reembolso processado',
      })
    }

    if (refundType === 'purchase' && paymentIntentId) {
      // Buscar compra no banco
      const { data: purchase } = await supabase
        .from('purchased_books')
        .select('*')
        .eq('user_id', user.id)
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single()

      if (!purchase) {
        return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
      }

      // Verificar se a compra foi feita há menos de 7 dias
      const purchaseDate = new Date(purchase.created_at)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      if (purchaseDate < sevenDaysAgo) {
        return NextResponse.json(
          { error: 'Período de reembolso expirado (7 dias)' },
          { status: 400 }
        )
      }

      // Reembolsar no Stripe
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
      })

      // Remover do banco
      await supabase.from('purchased_books').delete().eq('id', purchase.id)

      return NextResponse.json({
        success: true,
        message: 'Reembolso processado com sucesso',
      })
    }

    return NextResponse.json({ error: 'Tipo de reembolso inválido' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao processar reembolso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
