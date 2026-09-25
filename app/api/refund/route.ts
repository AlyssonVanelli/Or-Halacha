import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refundAndCancelSubscription } from '@/lib/stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

// Usado pela página /refund como verificação de disponibilidade
export async function GET() {
  return NextResponse.json({ message: 'API de reembolso funcionando' })
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { refundType, subscriptionId, paymentIntentId } = await req.json()

    if (!refundType) {
      return NextResponse.json({ error: 'Tipo de reembolso é obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()
    const sevenDaysAgo = new Date(Date.now() - REFUND_WINDOW_MS)

    if (refundType === 'subscription' && subscriptionId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!subscription?.subscription_id || subscription.status === 'canceled') {
        return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
      }

      if (new Date(subscription.created_at) < sevenDaysAgo) {
        return NextResponse.json(
          { error: 'Período de reembolso expirado (7 dias)' },
          { status: 400 }
        )
      }

      await refundAndCancelSubscription(subscription.subscription_id)

      const { error: updateError } = await admin
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
        message: 'Assinatura cancelada e reembolso processado',
      })
    }

    if (refundType === 'purchase' && paymentIntentId) {
      const { data: purchase } = await supabase
        .from('purchased_books')
        .select('*')
        .eq('user_id', user.id)
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle()

      if (!purchase) {
        return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
      }

      if (new Date(purchase.created_at) < sevenDaysAgo) {
        return NextResponse.json(
          { error: 'Período de reembolso expirado (7 dias)' },
          { status: 400 }
        )
      }

      try {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason: 'requested_by_customer',
        })
      } catch (refundError) {
        console.error('Erro ao reembolsar no Stripe:', refundError)
        return NextResponse.json(
          { error: 'Erro ao processar reembolso no Stripe' },
          { status: 500 }
        )
      }

      const { error: deleteError } = await admin
        .from('purchased_books')
        .delete()
        .eq('id', purchase.id)

      if (deleteError) {
        console.error('Erro ao remover compra reembolsada:', deleteError.message)
        return NextResponse.json({ error: 'Erro ao remover compra' }, { status: 500 })
      }

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
