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

async function completeSync(userId) {
  console.log('=== SINCRONIZAÇÃO COMPLETA - NOVA ABORDAGEM ===')
  console.log('User ID:', userId)

  try {
    // 1. Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      console.error('ERRO: Perfil não encontrado')
      return
    }

    if (!profile.stripe_customer_id) {
      console.error('ERRO: Usuário não tem Stripe Customer ID')
      return
    }

    console.log('Perfil encontrado:', profile)

    // 2. Buscar assinatura atual no banco
    const { data: dbSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (dbError) {
      console.error('ERRO ao buscar assinatura no banco:', dbError)
      return
    }

    console.log('=== ASSINATURA ATUAL NO BANCO ===')
    if (dbSubscription) {
      console.log('ID:', dbSubscription.id)
      console.log('Status:', dbSubscription.status)
      console.log('Price ID:', dbSubscription.price_id)
      console.log('Explicação Prática:', dbSubscription.explicacao_pratica)
      console.log('Plan Type:', dbSubscription.plan_type)
    } else {
      console.log('Nenhuma assinatura encontrada no banco')
    }

    // 3. Buscar TODAS as assinaturas no Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 100,
    })

    console.log(`\n=== ASSINATURAS NO STRIPE ===`)
    console.log(`Encontradas: ${stripeSubscriptions.data.length}`)

    if (stripeSubscriptions.data.length === 0) {
      console.log('NENHUMA ASSINATURA NO STRIPE - CANCELANDO NO BANCO')

      if (dbSubscription) {
        const { data: cancelResult, error: cancelError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select()

        if (cancelError) {
          console.error('ERRO ao cancelar:', cancelError)
        } else {
          console.log('SUCESSO! Assinatura cancelada no banco')
        }
      }

      return
    }

    // 4. Mostrar todas as assinaturas
    stripeSubscriptions.data.forEach((sub, index) => {
      console.log(`\nAssinatura ${index + 1}:`)
      console.log('  ID:', sub.id)
      console.log('  Status:', sub.status)
      console.log('  Criada:', new Date(sub.created * 1000).toISOString())
      console.log('  Price ID:', sub.items.data[0]?.price?.id)
      console.log(
        '  Cancelada em:',
        sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : 'Não cancelada'
      )
    })

    // 5. Pegar a mais recente
    const latestSubscription = stripeSubscriptions.data.sort((a, b) => b.created - a.created)[0]

    console.log('\n=== ASSINATURA MAIS RECENTE ===')
    console.log('ID:', latestSubscription.id)
    console.log('Status:', latestSubscription.status)
    console.log('Price ID:', latestSubscription.items.data[0]?.price?.id)
    console.log('Current Period Start:', latestSubscription.current_period_start)
    console.log('Current Period End:', latestSubscription.current_period_end)
    console.log('Cancel At Period End:', latestSubscription.cancel_at_period_end)
    console.log('Canceled At:', latestSubscription.canceled_at)

    // 6. Determinar tipo de plano
    const priceId = latestSubscription.items.data[0]?.price?.id || ''
    const isPlus =
      priceId.includes('plus') ||
      priceId.includes('Plus') ||
      priceId === 'price_1RQCodFLuMsSi0YiE0JiHq40'
    const planType =
      priceId.includes('monthly') || priceId.includes('mensal') ? 'monthly' : 'yearly'

    console.log('\n=== DETECÇÃO DE PLANO ===')
    console.log('Price ID:', priceId)
    console.log('É Plus:', isPlus)
    console.log('Plan Type:', planType)

    // 7. Preparar dados para sincronização
    const subscriptionData = {
      user_id: profile.id,
      status: latestSubscription.status,
      plan_type: planType,
      price_id: priceId,
      subscription_id: latestSubscription.id,
      current_period_start: latestSubscription.current_period_start
        ? new Date(latestSubscription.current_period_start * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: latestSubscription.current_period_end
        ? new Date(latestSubscription.current_period_end * 1000).toISOString()
        : new Date(
            Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
          ).toISOString(),
      cancel_at_period_end: latestSubscription.cancel_at_period_end || false,
      explicacao_pratica: isPlus,
      updated_at: new Date().toISOString(),
    }

    console.log('\n=== DADOS PARA SINCRONIZAÇÃO ===')
    console.log('Explicação Prática:', isPlus)
    console.log('Status:', latestSubscription.status)
    console.log('Dados completos:', subscriptionData)

    // 8. Sincronizar com banco
    const { data: syncResult, error: syncError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (syncError) {
      console.error('ERRO ao sincronizar:', syncError)
      return
    }

    console.log('\n=== SUCESSO! SINCRONIZAÇÃO COMPLETA ===')
    console.log('Assinatura sincronizada:', syncResult[0])

    if (dbSubscription) {
      console.log('\n=== MUDANÇAS REALIZADAS ===')
      console.log('Explicação Prática:', dbSubscription.explicacao_pratica, '->', isPlus)
      console.log('Status:', dbSubscription.status, '->', latestSubscription.status)
      console.log('Price ID:', dbSubscription.price_id, '->', priceId)
      console.log('Plan Type:', dbSubscription.plan_type, '->', planType)
    }
  } catch (error) {
    console.error('ERRO geral na sincronização:', error)
  }
}

// Executar com seu user ID
const userId = '3f0e0184-c0a7-487e-b611-72890b39dcce'
completeSync(userId)
