import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const divisionId = searchParams.get('divisionId')
    
    if (!divisionId) {
      return NextResponse.json({ error: 'divisionId é obrigatório' }, { status: 400 })
    }

    // Redirecionar para página de checkout com parâmetros
    const checkoutUrl = `/payment?divisionId=${divisionId}`
    return NextResponse.redirect(checkoutUrl)
    
  } catch (error) {
    console.error('❌ Erro na API GET create-purchase-checkout:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      userId, 
      bookId, 
      divisionId, 
      priceId, 
      successUrl, 
      cancelUrl,
      planType = 'tratado-avulso' // Default para tratado avulso
    } = body

    if (!userId || !priceId) {
      return NextResponse.json({ error: 'userId e priceId são obrigatórios' }, { status: 400 })
    }

    console.log('🚀 API create-purchase-checkout chamada')
    console.log('📊 Dados recebidos:', { userId, bookId, divisionId, priceId, planType })

    const supabase = createClient()

    // Buscar ou criar customer no Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    let stripeCustomerId = profile?.stripe_customer_id

    if (!stripeCustomerId) {
      console.log('👤 Criando customer no Stripe...')
      const customer = await stripe.customers.create({
        email: body.userEmail,
        metadata: { userId }
      })
      stripeCustomerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId)
    }

    // Buscar price para determinar o tipo
    const price = await stripe.prices.retrieve(priceId)
    console.log('💰 Price encontrado:', { id: price.id, type: price.type })

    // Configurar sessão
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        userId,
        planType,
        ...(bookId && { bookId }),
        ...(divisionId && { divisionId }),
      },
    }

    // Determinar modo baseado no tipo de price
    if (price.type === 'recurring') {
      sessionConfig.mode = 'subscription'
      console.log('🔄 Modo: subscription (recorrente)')
    } else {
      sessionConfig.mode = 'payment'
      console.log('💳 Modo: payment (único)')
    }

    // Adicionar item
    sessionConfig.line_items = [{
      price: priceId,
      quantity: 1,
    }]

    console.log('⚙️ Configuração final:', {
      mode: sessionConfig.mode,
      metadata: sessionConfig.metadata
    })

    const session = await stripe.checkout.sessions.create(sessionConfig)
    
    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    })

  } catch (error) {
    console.error('❌ Erro na API create-purchase-checkout:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

