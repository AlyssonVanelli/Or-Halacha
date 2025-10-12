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
    console.log('=== INÍCIO DO PROCESSO DE REEMBOLSO ===')
    console.log('API /api/refund chamada')

    const supabase = await createClient()
    console.log('Cliente Supabase criado')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log('Usuário autenticado:', !!user, 'Erro:', userError)
    console.log('ID do usuário:', user?.id)

    if (userError || !user) {
      console.log('ERRO: Usuário não autenticado')
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    console.log('Dados recebidos:', body)

    const { refundType, subscriptionId, paymentIntentId } = body

    if (!refundType) {
      console.log('ERRO: Tipo de reembolso é obrigatório')
      return NextResponse.json({ error: 'Tipo de reembolso é obrigatório' }, { status: 400 })
    }

    console.log('Tipo de reembolso:', refundType)
    console.log('Subscription ID:', subscriptionId)
    console.log('Payment Intent ID:', paymentIntentId)

    // Verificar se o usuário tem acesso ao que está tentando reembolsar
    if (refundType === 'subscription' && subscriptionId) {
      console.log('Verificando acesso à assinatura:', subscriptionId)

      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', user.id)
        .single()

      console.log('Resultado da consulta de assinatura:', {
        subscription,
        error: subscriptionError,
      })

      if (subscriptionError) {
        console.log('ERRO na consulta de assinatura:', subscriptionError)
        return NextResponse.json({ error: 'Erro ao verificar assinatura' }, { status: 500 })
      }

      if (!subscription) {
        console.log('ERRO: Assinatura não encontrada para o usuário')
        return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
      }

      console.log('Assinatura encontrada:', subscription)

      // Verificar se a assinatura foi criada há menos de 7 dias
      const subscriptionDate = new Date(subscription.created_at)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      console.log('Data da assinatura:', subscriptionDate.toISOString())
      console.log('7 dias atrás:', sevenDaysAgo.toISOString())
      console.log('É elegível?', subscriptionDate >= sevenDaysAgo)

      if (subscriptionDate < sevenDaysAgo) {
        console.log('ERRO: Assinatura não é elegível para reembolso (prazo de 7 dias expirado)')
        return NextResponse.json(
          { error: 'Período de reembolso expirado (7 dias)' },
          { status: 400 }
        )
      }

      // Cancelar assinatura no Stripe
      console.log('Cancelando assinatura no Stripe:', subscription.stripe_subscription_id)
      const canceledSubscription = await stripe.subscriptions.cancel(
        subscription.stripe_subscription_id
      )
      console.log('Assinatura cancelada no Stripe:', canceledSubscription.id)

      // Atualizar status no banco
      console.log('Atualizando status no banco de dados')
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled', cancel_reason: 'refund_requested' })
        .eq('id', subscriptionId)

      if (updateError) {
        console.log('ERRO ao atualizar status no banco:', updateError)
        return NextResponse.json({ error: 'Erro ao atualizar assinatura' }, { status: 500 })
      }

      console.log('Status atualizado no banco com sucesso')

      // Reembolsar pagamento se possível
      if (subscription.stripe_payment_intent_id) {
        console.log('Processando reembolso do pagamento:', subscription.stripe_payment_intent_id)
        try {
          const refund = await stripe.refunds.create({
            payment_intent: subscription.stripe_payment_intent_id,
            reason: 'requested_by_customer',
          })
          console.log('Reembolso criado no Stripe:', refund.id)
        } catch (refundError) {
          console.log('ERRO ao reembolsar:', refundError)
          // Continuar mesmo se o reembolso falhar
        }
      } else {
        console.log('Nenhum payment_intent_id encontrado para reembolso')
      }

      console.log('=== REEMBOLSO DE ASSINATURA CONCLUÍDO COM SUCESSO ===')
      return NextResponse.json({
        success: true,
        message: 'Assinatura cancelada e reembolso processado',
      })
    }

    if (refundType === 'purchase' && paymentIntentId) {
      console.log('=== PROCESSANDO REEMBOLSO DE COMPRA ===')
      console.log('Buscando compra no banco de dados...')
      console.log('User ID:', user.id)
      console.log('Payment Intent ID:', paymentIntentId)

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchased_books')
        .select('*')
        .eq('user_id', user.id)
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single()

      console.log('Resultado da busca de compra:', { purchase, error: purchaseError })

      if (purchaseError) {
        console.log('ERRO na consulta de compra:', purchaseError)
        return NextResponse.json({ error: 'Erro ao verificar compra' }, { status: 500 })
      }

      if (!purchase) {
        console.log('ERRO: Compra não encontrada para o usuário')
        return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
      }

      console.log('Compra encontrada:', purchase)

      // Verificar se a compra foi feita há menos de 7 dias
      const purchaseDate = new Date(purchase.created_at)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      console.log('Data da compra:', purchaseDate.toISOString())
      console.log('7 dias atrás:', sevenDaysAgo.toISOString())
      console.log('É elegível?', purchaseDate >= sevenDaysAgo)

      if (purchaseDate < sevenDaysAgo) {
        console.log('ERRO: Compra não é elegível para reembolso (prazo de 7 dias expirado)')
        return NextResponse.json(
          { error: 'Período de reembolso expirado (7 dias)' },
          { status: 400 }
        )
      }

      // Reembolsar no Stripe
      console.log('Processando reembolso no Stripe:', paymentIntentId)
      try {
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason: 'requested_by_customer',
        })
        console.log('Reembolso criado no Stripe:', refund.id)
      } catch (refundError) {
        console.log('ERRO ao reembolsar no Stripe:', refundError)
        return NextResponse.json(
          { error: 'Erro ao processar reembolso no Stripe' },
          { status: 500 }
        )
      }

      // Remover do banco
      console.log('Removendo compra do banco de dados:', purchase.id)
      const { error: deleteError } = await supabase
        .from('purchased_books')
        .delete()
        .eq('id', purchase.id)

      if (deleteError) {
        console.log('ERRO ao remover compra do banco:', deleteError)
        return NextResponse.json({ error: 'Erro ao remover compra' }, { status: 500 })
      }

      console.log('Compra removida do banco com sucesso')

      console.log('=== REEMBOLSO DE COMPRA CONCLUÍDO COM SUCESSO ===')
      return NextResponse.json({
        success: true,
        message: 'Reembolso processado com sucesso',
      })
    }

    return NextResponse.json({ error: 'Tipo de reembolso inválido' }, { status: 400 })
  } catch (error) {
    console.log('=== ERRO NO PROCESSO DE REEMBOLSO ===')
    console.error('Erro ao processar reembolso:', error)
    console.log('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
