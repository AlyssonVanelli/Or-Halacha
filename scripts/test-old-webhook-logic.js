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

async function testOldWebhookLogic(userId) {
  console.log('=== TESTANDO LÓGICA DO WEBHOOK ANTIGO ===')
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
    const { data: currentSub, error: dbError } = await supabase
      .from('subscriptions')
      .select('status, subscription_id, explicacao_pratica')
      .eq('user_id', userId)
      .maybeSingle()

    if (dbError) {
      console.error('ERRO ao buscar assinatura:', dbError)
      return
    }

    console.log('=== ASSINATURA ATUAL NO BANCO ===')
    console.log('Status:', currentSub?.status)
    console.log('Subscription ID:', currentSub?.subscription_id)
    console.log('Explicação Prática:', currentSub?.explicacao_pratica)

    // 3. Buscar assinaturas no Stripe
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

    // 4. Pegar a assinatura mais recente
    const subscription = stripeSubscriptions.data.sort((a, b) => b.created - a.created)[0]

    console.log('\n=== ASSINATURA MAIS RECENTE ===')
    console.log('ID:', subscription.id)
    console.log('Status:', subscription.status)
    console.log('Customer:', subscription.customer)
    console.log('Items:', subscription.items.data.length)

    // 5. Aplicar lógica do webhook antigo
    const item = subscription.items.data[0]
    if (!item || !item.price) {
      console.log('ERRO: Item ou price não encontrado')
      return
    }

    const priceId = item.price.id ?? ''
    const planType = item.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

    console.log('\n=== INFO DO PLANO ===')
    console.log('Price ID:', priceId)
    console.log('Plan Type:', planType)

    // Busca nome do produto e nickname do preço
    let priceName = ''
    let productName = ''
    if (item.price.nickname) priceName = item.price.nickname.toLowerCase()
    if (
      typeof item.price.product === 'object' &&
      item.price.product &&
      'name' in item.price.product
    ) {
      productName = item.price.product.name.toLowerCase()
    }

    console.log('Price Name:', priceName)
    console.log('Product Name:', productName)

    // Detectar se é Plus
    let explicacaoPratica =
      priceId.toLowerCase().includes('plus') ||
      priceName.includes('plus') ||
      productName.includes('plus')

    console.log('\n=== DETECÇÃO DE PLUS ===')
    console.log('É Plus por Price ID:', priceId.toLowerCase().includes('plus'))
    console.log('É Plus por Price Name:', priceName.includes('plus'))
    console.log('É Plus por Product Name:', productName.includes('plus'))
    console.log('Resultado Final:', explicacaoPratica)

    // Buscar nome do produto na API do Stripe se necessário
    if (!explicacaoPratica) {
      try {
        const productId = typeof item.price.product === 'string' ? item.price.product : undefined
        if (productId) {
          const product = await stripe.products.retrieve(productId)
          console.log('Product Name da API:', product.name)
          if (product.name.toLowerCase().includes('plus')) {
            explicacaoPratica = true
            console.log('É Plus por API do Stripe!')
          }
        }
      } catch (err) {
        console.log('Erro ao buscar produto na API:', err.message)
      }
    }

    // Se cancelar, explicacao_pratica deve ser false
    if (subscription.status === 'canceled') {
      explicacaoPratica = false
      console.log('Assinatura cancelada - Explicação Prática = false')
    }

    console.log('\n=== RESULTADO FINAL ===')
    console.log('Explicação Prática:', explicacaoPratica)
    console.log('Status:', subscription.status)
    console.log('Plan Type:', planType)

    // 6. Preparar dados para atualização
    const now = new Date().toISOString()
    const updateData = {
      user_id: profile.id,
      status: subscription.status,
      plan_type: planType,
      price_id: priceId,
      subscription_id: subscription.id,
      cancel_at_period_end: subscription.cancel_at_period_end,
      explicacao_pratica: explicacaoPratica,
      updated_at: now,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    }

    console.log('\n=== DADOS PARA ATUALIZAÇÃO ===')
    console.log(JSON.stringify(updateData, null, 2))

    // 7. Atualizar no banco
    const { data: result, error: updateError } = await supabase
      .from('subscriptions')
      .upsert([updateData], { onConflict: 'user_id' })
      .select()

    if (updateError) {
      console.error('ERRO ao atualizar:', updateError)
      return
    }

    console.log('\n=== SUCESSO! ASSINATURA ATUALIZADA ===')
    console.log('Resultado:', result[0])

    if (currentSub) {
      console.log('\n=== MUDANÇAS REALIZADAS ===')
      console.log('Explicação Prática:', currentSub.explicacao_pratica, '->', explicacaoPratica)
      console.log('Status:', currentSub.status, '->', subscription.status)
    }
  } catch (error) {
    console.error('ERRO geral:', error)
  }
}

// Executar com seu user ID
const userId = '3f0e0184-c0a7-487e-b611-72890b39dcce'
testOldWebhookLogic(userId)
