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

async function testSyncWithoutDuplicates(userId) {
  console.log('=== TESTANDO SINCRONIZAÇÃO SEM DUPLICATAS ===')
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

    // 2. Buscar assinaturas atuais no banco
    const { data: dbSubscriptions, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('ERRO ao buscar assinaturas:', dbError)
      return
    }

    console.log(`\n=== ASSINATURAS NO BANCO ===`)
    console.log(`Encontradas: ${dbSubscriptions.length}`)
    dbSubscriptions.forEach((sub, index) => {
      console.log(
        `${index + 1}. ID: ${sub.id}, Status: ${sub.status}, Subscription ID: ${sub.subscription_id}`
      )
    })

    // 3. Buscar assinaturas no Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 10,
    })

    console.log(`\n=== ASSINATURAS NO STRIPE ===`)
    console.log(`Encontradas: ${stripeSubscriptions.data.length}`)
    stripeSubscriptions.data.forEach((sub, index) => {
      console.log(
        `${index + 1}. ID: ${sub.id}, Status: ${sub.status}, Created: ${new Date(sub.created * 1000).toISOString()}`
      )
    })

    if (stripeSubscriptions.data.length === 0) {
      console.log('\nNENHUMA ASSINATURA NO STRIPE - CANCELANDO NO BANCO')

      for (const sub of dbSubscriptions) {
        const { error: cancelError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id)

        if (cancelError) {
          console.error(`ERRO ao cancelar ${sub.id}:`, cancelError)
        } else {
          console.log(`✅ Cancelado: ${sub.id}`)
        }
      }

      return
    }

    // 4. Pegar a assinatura mais recente do Stripe
    const latestStripeSub = stripeSubscriptions.data.sort((a, b) => b.created - a.created)[0]

    console.log(`\n=== ASSINATURA MAIS RECENTE NO STRIPE ===`)
    console.log('ID:', latestStripeSub.id)
    console.log('Status:', latestStripeSub.status)
    console.log('Price ID:', latestStripeSub.items.data[0]?.price?.id)
    console.log('Current Period Start:', latestStripeSub.current_period_start)
    console.log('Current Period End:', latestStripeSub.current_period_end)

    // 5. Verificar se já existe no banco
    const existingSub = dbSubscriptions.find(sub => sub.subscription_id === latestStripeSub.id)

    if (existingSub) {
      console.log(`\n=== ASSINATURA JÁ EXISTE NO BANCO ===`)
      console.log('ID no banco:', existingSub.id)
      console.log('Status atual:', existingSub.status)
      console.log('Status no Stripe:', latestStripeSub.status)

      // Atualizar se necessário
      if (existingSub.status !== latestStripeSub.status) {
        console.log('\n=== ATUALIZANDO STATUS ===')

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: latestStripeSub.status,
            current_period_start: latestStripeSub.current_period_start
              ? new Date(latestStripeSub.current_period_start * 1000).toISOString()
              : null,
            current_period_end: latestStripeSub.current_period_end
              ? new Date(latestStripeSub.current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: latestStripeSub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSub.id)

        if (updateError) {
          console.error('ERRO ao atualizar:', updateError)
        } else {
          console.log('✅ Status atualizado com sucesso!')
        }
      } else {
        console.log('✅ Status já está sincronizado!')
      }
    } else {
      console.log(`\n=== CRIANDO NOVA ASSINATURA ===`)

      // Determinar tipo de plano
      const priceId = latestStripeSub.items.data[0]?.price?.id || ''
      const planType =
        latestStripeSub.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly'

      // Detectar se é Plus
      const isPlus =
        priceId.includes('plus') ||
        priceId.includes('Plus') ||
        priceId === 'price_1RQCodFLuMsSi0YiE0JiHq40'

      console.log('Price ID:', priceId)
      console.log('Plan Type:', planType)
      console.log('É Plus:', isPlus)

      // Cancelar outras assinaturas ativas do usuário
      const { error: cancelOthersError } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', userId)
        .eq('status', 'active')

      if (cancelOthersError) {
        console.error('ERRO ao cancelar outras assinaturas:', cancelOthersError)
      } else {
        console.log('✅ Outras assinaturas canceladas')
      }

      // Criar nova assinatura
      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: profile.id,
          status: latestStripeSub.status,
          plan_type: planType,
          price_id: priceId,
          subscription_id: latestStripeSub.id,
          current_period_start: latestStripeSub.current_period_start
            ? new Date(latestStripeSub.current_period_start * 1000).toISOString()
            : null,
          current_period_end: latestStripeSub.current_period_end
            ? new Date(latestStripeSub.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: latestStripeSub.cancel_at_period_end,
          explicacao_pratica: isPlus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (createError) {
        console.error('ERRO ao criar assinatura:', createError)
      } else {
        console.log('✅ Nova assinatura criada:', newSub[0])
      }
    }

    console.log('\n=== SINCRONIZAÇÃO CONCLUÍDA ===')
  } catch (error) {
    console.error('ERRO geral:', error)
  }
}

// Executar com seu user ID
const userId = '3f0e0184-c0a7-487e-b611-72890b39dcce'
testSyncWithoutDuplicates(userId)
