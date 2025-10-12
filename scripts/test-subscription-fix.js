const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

const supabase = createClient(supabaseUrl, supabaseKey)
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
})

async function testSubscriptionFix(userId) {
  console.log('=== TESTANDO CORREÇÃO DE ASSINATURA ===')
  console.log('User ID:', userId)

  try {
    // 1. Buscar assinatura atual no banco
    const { data: dbSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (dbError) {
      console.error('ERRO ao buscar assinatura:', dbError)
      return
    }

    if (!dbSubscription) {
      console.log('ERRO: Assinatura não encontrada no banco')
      return
    }

    console.log('=== ASSINATURA ATUAL NO BANCO ===')
    console.log('ID:', dbSubscription.id)
    console.log('Status:', dbSubscription.status)
    console.log('Price ID:', dbSubscription.price_id)
    console.log('Explicação Prática:', dbSubscription.explicacao_pratica)
    console.log('Plan Type:', dbSubscription.plan_type)
    console.log('Subscription ID:', dbSubscription.subscription_id)

    // 2. Buscar no Stripe
    let stripeSubscription = null

    if (dbSubscription.subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(dbSubscription.subscription_id)
        console.log('Assinatura encontrada no Stripe via ID')
      } catch (stripeError) {
        console.log('Erro ao buscar por ID, tentando por customer...')
      }
    }

    // 3. Se não encontrou por ID, buscar por customer
    if (!stripeSubscription) {
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .maybeSingle()

      if (profileError || !profile || !profile.stripe_customer_id) {
        console.log('ERRO: Perfil não encontrado ou sem Stripe Customer ID')
        return
      }

      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'all',
        limit: 10,
      })

      if (stripeSubscriptions.data.length > 0) {
        // Pegar a mais recente e ativa
        stripeSubscription = stripeSubscriptions.data
          .filter(sub => sub.status === 'active')
          .sort((a, b) => b.created - a.created)[0]

        if (!stripeSubscription) {
          // Se não tem ativa, pegar a mais recente
          stripeSubscription = stripeSubscriptions.data.sort((a, b) => b.created - a.created)[0]
        }
      }
    }

    if (!stripeSubscription) {
      console.log('ERRO: Nenhuma assinatura encontrada no Stripe')
      return
    }

    console.log('=== ASSINATURA NO STRIPE ===')
    console.log('ID:', stripeSubscription.id)
    console.log('Status:', stripeSubscription.status)
    console.log('Price ID:', stripeSubscription.items.data[0]?.price?.id)
    console.log('Current Period Start:', stripeSubscription.current_period_start)
    console.log('Current Period End:', stripeSubscription.current_period_end)

    // 4. Determinar se é Plus
    const priceId = stripeSubscription.items.data[0]?.price?.id || ''
    const isPlusSubscription =
      priceId.includes('plus') ||
      priceId.includes('Plus') ||
      priceId === 'price_1RQCodFLuMsSi0YiE0JiHq40'

    console.log('=== DETECÇÃO DE ASSINATURA PLUS ===')
    console.log('Price ID:', priceId)
    console.log('É Plus?', isPlusSubscription)

    // 5. Determinar plan_type
    let planType = 'yearly'
    if (priceId.includes('monthly') || priceId.includes('mensal')) {
      planType = 'monthly'
    }

    // 6. Preparar dados para atualização
    const updateData = {
      status: stripeSubscription.status,
      plan_type: planType,
      price_id: priceId,
      subscription_id: stripeSubscription.id,
      current_period_start: stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
        : new Date(
            Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
          ).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      explicacao_pratica: isPlusSubscription, // CORRIGIDO
      updated_at: new Date().toISOString(),
    }

    console.log('=== DADOS PARA ATUALIZAÇÃO ===')
    console.log('Explicação Prática:', isPlusSubscription)
    console.log('Dados completos:', updateData)

    // 7. Atualizar no banco
    const { data: updateResult, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId)
      .select()

    if (updateError) {
      console.error('ERRO ao atualizar assinatura:', updateError)
      return
    }

    console.log('SUCESSO! Assinatura corrigida:', updateResult[0])

    console.log('=== MUDANÇAS REALIZADAS ===')
    console.log('Explicação Prática:', dbSubscription.explicacao_pratica, '->', isPlusSubscription)
    console.log('Price ID:', dbSubscription.price_id, '->', priceId)
    console.log('Status:', dbSubscription.status, '->', stripeSubscription.status)
    console.log('Plan Type:', dbSubscription.plan_type, '->', planType)
  } catch (error) {
    console.error('ERRO geral no teste:', error)
  }
}

// Executar com seu user ID
const userId = '3f0e0184-c0a7-487e-b611-72890b39dcce'
testSubscriptionFix(userId)
