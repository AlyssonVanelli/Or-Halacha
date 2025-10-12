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

        const now = new Date().toISOString()

        // ───────────────── Datas de período ─────────────────
        let currentPeriodStart: string | null = null
        let currentPeriodEnd: string | null = null

        // Verificar se as datas existem e são válidas
        if (
          (subscription as any).current_period_start &&
          typeof (subscription as any).current_period_start === 'number'
        ) {
          currentPeriodStart = new Date(
            (subscription as any).current_period_start * 1000
          ).toISOString()
        }

        if (
          (subscription as any).current_period_end &&
          typeof (subscription as any).current_period_end === 'number'
        ) {
          currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString()
        }

        // Se as datas não existem, tentar pegar do item da subscription
        if (!currentPeriodStart || !currentPeriodEnd) {
          const item = subscription.items.data[0]
          if (item && item.current_period_start && item.current_period_end) {
            currentPeriodStart = new Date(item.current_period_start * 1000).toISOString()
            currentPeriodEnd = new Date(item.current_period_end * 1000).toISOString()
            console.log('Datas obtidas do item da subscription')
          }
        }

        console.log('Current Period Start:', currentPeriodStart)
        console.log('Current Period End:', currentPeriodEnd)

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
          updated_at: now,
        }
        if (currentPeriodStart) updateData['current_period_start'] = currentPeriodStart
        if (currentPeriodEnd) updateData['current_period_end'] = currentPeriodEnd
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
