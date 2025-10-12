const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')
require('dotenv').config()

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key presente:', !!supabaseKey)
console.log('Stripe Key presente:', !!stripeSecretKey)

if (!supabaseUrl || !supabaseKey || !stripeSecretKey) {
  console.error('ERRO: Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
})

async function testNewWebhook(userId) {
  console.log('=== TESTANDO NOVO WEBHOOK ===')
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

    // 2. Buscar assinaturas no Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 10,
    })

    console.log(`\n=== ASSINATURAS NO STRIPE ===`)
    console.log(`Encontradas: ${stripeSubscriptions.data.length}`)

    if (stripeSubscriptions.data.length === 0) {
      console.log('NENHUMA ASSINATURA NO STRIPE')
      return
    }

    // 3. Pegar a mais recente
    const subscription = stripeSubscriptions.data.sort((a, b) => b.created - a.created)[0]

    console.log('\n=== ASSINATURA MAIS RECENTE ===')
    console.log('ID:', subscription.id)
    console.log('Status:', subscription.status)
    console.log('Customer:', subscription.customer)
    console.log('Items:', subscription.items.data.length)

    // 4. Detectar se é Plus
    const priceId = subscription.items?.data?.[0]?.price?.id || ''
    const isPlus = priceId.includes('plus') || priceId.includes('Plus')

    console.log('\n=== DETECÇÃO DE PLUS ===')
    console.log('Price ID:', priceId)
    console.log('É Plus:', isPlus)

    // 5. Determinar tipo de plano
    const planType =
      subscription.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly'

    console.log('Plan Type:', planType)

    // 6. Preparar dados
    const subscriptionData = {
      user_id: profile.id,
      status: subscription.status,
      plan_type: planType,
      price_id: priceId,
      subscription_id: subscription.id,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      explicacao_pratica: isPlus,
      updated_at: new Date().toISOString(),
    }

    console.log('\n=== DADOS PARA SALVAR ===')
    console.log(JSON.stringify(subscriptionData, null, 2))

    // 7. Salvar no banco
    const { data: result, error: saveError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()

    if (saveError) {
      console.error('ERRO ao salvar:', saveError)
    } else {
      console.log('\n=== SUCESSO! ===')
      console.log('Assinatura salva:', result[0])
    }
  } catch (error) {
    console.error('ERRO geral:', error)
  }
}

// Executar com seu user ID
const userId = '3f0e0184-c0a7-487e-b611-72890b39dcce'
testNewWebhook(userId)
