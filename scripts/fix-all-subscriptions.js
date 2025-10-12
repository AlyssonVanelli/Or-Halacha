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

async function fixAllSubscriptions() {
  console.log('=== CORRIGINDO TODAS AS ASSINATURAS ===')

  try {
    // 1. Buscar todas as assinaturas no banco
    const { data: subscriptions, error: dbError } = await supabase.from('subscriptions').select('*')

    if (dbError) {
      console.error('ERRO ao buscar assinaturas:', dbError)
      return
    }

    console.log(`Encontradas ${subscriptions.length} assinaturas no banco`)

    for (const subscription of subscriptions) {
      console.log(`\n=== CORRIGINDO ASSINATURA ${subscription.id} ===`)
      console.log('User ID:', subscription.user_id)
      console.log('Status atual:', subscription.status)
      console.log('Explicação Prática atual:', subscription.explicacao_pratica)
      console.log('Price ID atual:', subscription.price_id)

      try {
        // 2. Buscar no Stripe
        let stripeSubscription = null

        if (subscription.subscription_id) {
          try {
            stripeSubscription = await stripe.subscriptions.retrieve(subscription.subscription_id)
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
            .eq('id', subscription.user_id)
            .maybeSingle()

          if (profileError || !profile || !profile.stripe_customer_id) {
            console.log('ERRO: Perfil não encontrado ou sem Stripe Customer ID')
            continue
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
          console.log('ERRO: Assinatura não encontrada no Stripe')
          continue
        }

        console.log('Assinatura no Stripe:', {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          price_id: stripeSubscription.items.data[0]?.price?.id,
        })

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

        console.log('Dados para atualização:', updateData)

        // 7. Atualizar no banco
        const { data: updateResult, error: updateError } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('id', subscription.id)
          .select()

        if (updateError) {
          console.error('ERRO ao atualizar assinatura:', updateError)
          continue
        }

        console.log('SUCESSO! Assinatura corrigida:', updateResult[0])
        console.log('Mudanças:')
        console.log(
          '- Explicação Prática:',
          subscription.explicacao_pratica,
          '->',
          isPlusSubscription
        )
        console.log('- Price ID:', subscription.price_id, '->', priceId)
        console.log('- Status:', subscription.status, '->', stripeSubscription.status)
      } catch (error) {
        console.error('ERRO ao processar assinatura:', error)
        continue
      }
    }

    console.log('\n=== CORREÇÃO CONCLUÍDA ===')
  } catch (error) {
    console.error('ERRO geral:', error)
  }
}

// Executar
fixAllSubscriptions()
