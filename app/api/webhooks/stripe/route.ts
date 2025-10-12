import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/client'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-04-30.basil',
})

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook signature ou secret não configurados' },
      { status: 400 }
    )
  }
  const rawBody = Buffer.from(await req.arrayBuffer())

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  const supabase = await createClient()

  console.log('=== PROCESSANDO WEBHOOK ===')
  console.log('Event Type:', event.type)
  console.log('Event ID:', event.id)
  console.log('Event Data:', JSON.stringify(event.data, null, 2))

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      console.log('=== PROCESSANDO ASSINATURA ===')
      console.log('Subscription ID:', subscription.id)
      console.log('Status:', subscription.status)
      console.log('Customer:', customerId)
      console.log('Current Period Start (raw):', (subscription as any).current_period_start)
      console.log('Current Period End (raw):', (subscription as any).current_period_end)
      console.log('Cancel At Period End:', subscription.cancel_at_period_end)
      console.log('Canceled At:', subscription.canceled_at)

      // ───────────────── Buscar profile ─────────────────
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (!profile) {
        console.log('❌ Profile não encontrado para customer:', customerId)
        break
      }

      console.log('✅ Profile encontrado:', profile.id)

      // ───────────────── Buscar status atual ─────────────────
      const { data: currentSub } = await supabase
        .from('subscriptions')
        .select('status, subscription_id')
        .eq('user_id', profile.id)
        .maybeSingle()

      // Proteção de status robusta considerando subscription_id
      const statusOrder = {
        incomplete: 0,
        trialing: 1,
        active: 2,
        past_due: 3,
        unpaid: 4,
        canceled: 5,
        incomplete_expired: 6,
      } as const
      const currentStatus = currentSub?.status || 'incomplete'
      const currentSubscriptionId = currentSub?.subscription_id
      const incomingStatus = subscription.status
      const incomingSubscriptionId = subscription.id
      const currentStatusOrder = statusOrder[currentStatus as keyof typeof statusOrder] ?? 0
      const incomingStatusOrder = statusOrder[incomingStatus as keyof typeof statusOrder] ?? 0

      // Só bloqueia downgrade se for a mesma assinatura
      if (
        currentSubscriptionId === incomingSubscriptionId &&
        incomingStatusOrder < currentStatusOrder
      ) {
        console.log('⚠️ Downgrade bloqueado para mesma assinatura')
      } else {
        // ───────────────── Info do plano ─────────────────
        const item = subscription.items.data[0]
        if (!item || !item.price) {
          console.log('❌ Item ou price não encontrado')
          break
        }
        const priceId = item.price.id ?? ''
        const planType = item.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

        console.log('Price ID:', priceId)
        console.log('Plan Type:', planType)

        // Busca nome do produto e nickname do preço, se disponíveis
        let priceName = ''
        let productName = ''
        if (item.price.nickname) priceName = item.price.nickname.toLowerCase()
        if (
          typeof item.price.product === 'object' &&
          item.price.product &&
          'name' in item.price.product
        ) {
          productName = (item.price.product.name as string).toLowerCase()
        }

        // Detectar Plus baseado no metadata da session (mais confiável)
        let explicacaoPratica = false

        // Buscar session para pegar metadata
        try {
          const sessions = await stripe.checkout.sessions.list({
            subscription: subscription.id,
            limit: 1,
          })

          if (sessions.data.length > 0) {
            const session = sessions.data[0]
            const metadata = session.metadata || {}
            const isPlus = metadata.isPlus === 'true' || metadata.isPlus === 'true'
            const planType = metadata.planType || ''

            explicacaoPratica = isPlus || planType.toLowerCase().includes('plus')
            console.log('Metadata da session:', metadata)
            console.log('Is Plus do metadata:', isPlus)
            console.log('Plan Type do metadata:', planType)
          }
        } catch (err) {
          console.log('Erro ao buscar session, usando detecção alternativa:', err)
        }

        // Fallback: detecção por price ID e nomes
        if (!explicacaoPratica) {
          explicacaoPratica =
            priceId.toLowerCase().includes('plus') ||
            priceName.includes('plus') ||
            productName.includes('plus')
        }

        // Se cancelar, explicacao_pratica deve ser false
        if (incomingStatus === 'canceled') {
          explicacaoPratica = false
        }

        console.log('Explicação Prática final:', explicacaoPratica)

        // ───────────────── Datas de período ─────────────────
        // ESTRATÉGIA HÍBRIDA: Tentar múltiplas fontes e sempre garantir datas
        console.log('=== ESTRATÉGIA HÍBRIDA DE DATAS ===')
        console.log('Plan Type:', planType)

        // Tentar extrair do item primeiro
        const periodStartTs = item.current_period_start
        const periodEndTs = item.current_period_end

        console.log('🔍 DEBUG ITEM ACCESS:')
        console.log('item.current_period_start:', item.current_period_start)
        console.log('item.current_period_end:', item.current_period_end)

        // Tentar extrair do subscription também
        const subPeriodStartTs = (subscription as any).current_period_start
        const subPeriodEndTs = (subscription as any).current_period_end

        console.log('🔍 DEBUG DATAS:')
        console.log('Item Period Start TS:', periodStartTs)
        console.log('Item Period End TS:', periodEndTs)
        console.log('Subscription Period Start TS:', subPeriodStartTs)
        console.log('Subscription Period End TS:', subPeriodEndTs)
        console.log('Item completo:', JSON.stringify(item, null, 2))

        // Usar as datas do item se disponíveis, senão do subscription
        const finalStartTs = periodStartTs || subPeriodStartTs
        const finalEndTs = periodEndTs || subPeriodEndTs

        let currentPeriodStart: string | null = null
        let currentPeriodEnd: string | null = null

        if (finalStartTs && typeof finalStartTs === 'number' && finalStartTs > 0) {
          currentPeriodStart = new Date(finalStartTs * 1000).toISOString()
          console.log('✅ Data de início extraída do Stripe:', currentPeriodStart)
        }

        if (finalEndTs && typeof finalEndTs === 'number' && finalEndTs > 0) {
          currentPeriodEnd = new Date(finalEndTs * 1000).toISOString()
          console.log('✅ Data de fim extraída do Stripe:', currentPeriodEnd)
        }

        // Se ainda não temos as datas, calcular baseado no momento atual
        if (!currentPeriodStart || !currentPeriodEnd) {
          console.log('⚠️ Datas não encontradas no Stripe, calculando...')
          const now = new Date()
          currentPeriodStart = now.toISOString()

          // Calcular data de fim baseada no tipo de plano
          if (planType === 'yearly') {
            const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
            currentPeriodEnd = endDate.toISOString()
            console.log('📅 Calculado para plano anual: +365 dias')
          } else if (planType === 'monthly') {
            const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            currentPeriodEnd = endDate.toISOString()
            console.log('📅 Calculado para plano mensal: +30 dias')
          } else {
            // Fallback para 30 dias
            const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            currentPeriodEnd = endDate.toISOString()
            console.log('📅 Fallback: +30 dias')
          }
        }

        console.log('✅ Data de início final:', currentPeriodStart)
        console.log('✅ Data de fim final:', currentPeriodEnd)
        console.log('🎯 SALVANDO NO BANCO COM DATAS:', {
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
        })

        console.log('Current Period Start:', currentPeriodStart)
        console.log('Current Period End:', currentPeriodEnd)

        const now = new Date().toISOString()

        // ───────────────── Cancelar outras assinaturas ativas do usuário (apenas se não for cancelamento) ─────────────────
        if (incomingStatus !== 'canceled') {
          await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('user_id', profile.id)
            .neq('subscription_id', subscription.id)
            .eq('status', 'active')
        }

        // ───────────────── Upsert (atualiza, nunca duplica) ─────────────────
        const updateData: Record<string, unknown> = {
          user_id: profile.id,
          status: incomingStatus,
          plan_type: planType as 'monthly' | 'yearly',
          price_id: priceId,
          subscription_id: subscription.id,
          cancel_at_period_end: subscription.cancel_at_period_end,
          explicacao_pratica: explicacaoPratica,
          current_period_start: currentPeriodStart, // SEMPRE incluir as datas
          current_period_end: currentPeriodEnd, // SEMPRE incluir as datas
          updated_at: now,
        }
        if (event.type === 'customer.subscription.created') updateData['created_at'] = now

        console.log('Dados para upsert:', updateData)

        const { data: upsertResult, error: upsertError } = await supabase
          .from('subscriptions')
          .upsert([updateData], { onConflict: 'user_id' })
          .select()

        if (upsertError) {
          console.error('❌ Erro no upsert:', upsertError)
        } else {
          console.log('✅ Subscription upserted com sucesso:', upsertResult)

          // Verificar o que foi realmente salvo
          const { data: savedSub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('subscription_id', subscription.id)
            .single()

          console.log('=== VERIFICAÇÃO FINAL ===')
          console.log('Subscription salva no banco:', savedSub)

          // Log detalhado do que foi salvo
          if (savedSub) {
            console.log('=== DADOS SALVOS NO BANCO ===')
            console.log('User ID:', savedSub.user_id)
            console.log('Status:', savedSub.status)
            console.log('Plan Type:', savedSub.plan_type)
            console.log('Price ID:', savedSub.price_id)
            console.log('Subscription ID:', savedSub.subscription_id)
            console.log('Current Period Start:', savedSub.current_period_start)
            console.log('Current Period End:', savedSub.current_period_end)
            console.log('Explicação Prática:', savedSub.explicacao_pratica)
            console.log('Created At:', savedSub.created_at)
            console.log('Updated At:', savedSub.updated_at)
          }
        }
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      console.log('=== PAGAMENTO DE INVOICE SUCESSO ===')
      console.log('Invoice ID:', invoice.id)
      console.log('Customer:', invoice.customer)
      console.log('Subscription:', (invoice as any).subscription)
      console.log('Amount Paid:', invoice.amount_paid)
      console.log('Status:', invoice.status)

      // Se tem subscription, buscar e atualizar
      if ((invoice as any).subscription) {
        const subscriptionId = (invoice as any).subscription as string
        console.log('Buscando subscription:', subscriptionId)

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          console.log('Subscription encontrada:', subscription.id)
          console.log('Status:', subscription.status)
          console.log('Current Period Start:', (subscription as any).current_period_start)
          console.log('Current Period End:', (subscription as any).current_period_end)

          // Buscar customer
          const customerId = subscription.customer as string
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .maybeSingle()

          if (profile) {
            console.log('Profile encontrado:', profile.id)

            // Atualizar subscription com dados corretos
            const now = new Date().toISOString()
            const currentPeriodStart = (subscription as any).current_period_start
              ? new Date((subscription as any).current_period_start * 1000).toISOString()
              : now
            const currentPeriodEnd = (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

            const { data: result, error } = await supabase.from('subscriptions').upsert(
              {
                user_id: profile.id,
                status: subscription.status,
                plan_type:
                  subscription.items.data[0]?.price?.recurring?.interval === 'year'
                    ? 'yearly'
                    : 'monthly',
                price_id: subscription.items.data[0]?.price?.id || '',
                subscription_id: subscription.id,
                current_period_start: currentPeriodStart,
                current_period_end: currentPeriodEnd,
                cancel_at_period_end: subscription.cancel_at_period_end,
                explicacao_pratica: false, // Será determinado pela lógica de detecção
                updated_at: now,
              },
              { onConflict: 'user_id' }
            )

            if (error) {
              console.error('❌ Erro ao atualizar subscription:', error)
            } else {
              console.log('✅ Subscription atualizada:', result)
            }
          }
        } catch (err) {
          console.error('❌ Erro ao buscar subscription:', err)
        }
      }
      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('=== CHECKOUT COMPLETADO ===')
      console.log('Session ID:', session.id)
      console.log('Mode:', session.mode)
      console.log('Metadata:', session.metadata)

      // Verifica se é uma compra de tratado avulso
      const metadata = session.metadata as Record<string, string | undefined> | undefined
      if (metadata && metadata['divisionId'] && metadata['bookId'] && metadata['userId']) {
        const userId = metadata['userId']
        const bookId = metadata['bookId']
        const divisionId = metadata['divisionId']

        console.log('Processando compra avulsa:', { userId, bookId, divisionId })

        // Calcula a data de expiração (1 mês a partir de agora)
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        // Registra a compra na tabela purchased_books
        const { data: purchaseResult, error: purchaseError } = await supabase
          .from('purchased_books')
          .upsert(
            {
              user_id: userId,
              book_id: bookId,
              division_id: divisionId,
              expires_at: expiresAt.toISOString(),
              created_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,division_id',
            }
          )

        if (purchaseError) {
          console.error('❌ Erro ao salvar compra avulsa:', purchaseError)
        } else {
          console.log('✅ Compra avulsa salva:', purchaseResult)
        }
      }
      break
    }

    default:
      console.log(`Evento não tratado: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
