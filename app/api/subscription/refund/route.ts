import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(_request: NextRequest) {
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

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    // Verificar se está dentro do prazo de 7 dias
    const subscriptionDate = new Date(subscription.created_at)
    const now = new Date()
    const daysDifference = Math.floor(
      (now.getTime() - subscriptionDate.getTime()) / (1000 * 60 * 60 * 24)
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

    // Buscar o payment intent da assinatura no Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.subscription_id)
    const latestInvoice = await stripe.invoices.retrieve(
      stripeSubscription.latest_invoice as string
    )
    const paymentIntent = (latestInvoice as any).payment_intent as string

    // Processar reembolso no Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent,
      reason: 'requested_by_customer',
    })

    // Cancelar assinatura no Stripe
    await stripe.subscriptions.cancel(subscription.subscription_id)

    // Atualizar status no banco
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Erro ao atualizar assinatura:', updateError)
      return NextResponse.json({ error: 'Erro ao processar cancelamento' }, { status: 500 })
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
