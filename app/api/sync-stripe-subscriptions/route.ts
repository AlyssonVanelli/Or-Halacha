import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  console.log('=== SINCRONIZANDO ASSINATURAS COM STRIPE ===')

  const body = await req.json()
  const { userId } = body

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: 'userId é obrigatório',
      },
      { status: 400 }
    )
  }

  const supabase = createClient()

  try {
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Perfil não encontrado',
        },
        { status: 404 }
      )
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não tem Stripe Customer ID',
        },
        { status: 404 }
      )
    }

    console.log('Perfil encontrado:', profile)

    // Buscar assinaturas no Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 10,
    })

    console.log('Assinaturas no Stripe:', stripeSubscriptions.data.length)

    // Buscar assinatura no banco
    const { data: dbSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (dbError) {
      console.error('ERRO ao buscar assinatura no banco:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar assinatura no banco',
          details: dbError,
        },
        { status: 500 }
      )
    }

    console.log('Assinatura no banco:', dbSubscription)

    // Verificar se há diferenças
    const activeStripeSubscription = stripeSubscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    )

    const canceledStripeSubscription = stripeSubscriptions.data.find(
      sub => sub.status === 'canceled' || sub.status === 'incomplete_expired'
    )

    let needsUpdate = false
    let newStatus = dbSubscription?.status

    if (activeStripeSubscription && dbSubscription?.status !== 'active') {
      newStatus = 'active'
      needsUpdate = true
      console.log('Assinatura ativa no Stripe, mas inativa no banco')
    } else if (canceledStripeSubscription && dbSubscription?.status !== 'canceled') {
      newStatus = 'canceled'
      needsUpdate = true
      console.log('Assinatura cancelada no Stripe, mas ativa no banco')
    }

    if (needsUpdate) {
      console.log('Atualizando status da assinatura:', newStatus)

      const { data: updateResult, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()

      if (updateError) {
        console.error('ERRO ao atualizar assinatura:', updateError)
        return NextResponse.json(
          {
            success: false,
            error: 'Erro ao atualizar assinatura',
            details: updateError,
          },
          { status: 500 }
        )
      }

      console.log('Assinatura atualizada:', updateResult)

      return NextResponse.json({
        success: true,
        message: 'Assinatura sincronizada com Stripe',
        changes: {
          oldStatus: dbSubscription?.status,
          newStatus: newStatus,
        },
        subscription: updateResult[0],
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Assinatura já está sincronizada',
        subscription: dbSubscription,
      })
    }
  } catch (error) {
    console.error('ERRO geral na sincronização:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro geral na sincronização',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
