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
      console.log('Current Period Start:', (subscription as any).current_period_start)
      console.log('Current Period End:', (subscription as any).current_period_end)

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

        // Atualiza explicacao_pratica para true se for Plus em qualquer campo
        let explicacaoPratica =
          priceId.toLowerCase().includes('plus') ||
          priceName.includes('plus') ||
          productName.includes('plus')

        console.log('Detecção inicial de Plus:', explicacaoPratica)
        console.log('Price Name:', priceName)
        console.log('Product Name:', productName)

        if (!explicacaoPratica && currentStatus) {
          // Busca valor anterior
          try {
            const { data: currentSub } = await supabase
              .from('subscriptions')
              .select('explicacao_pratica')
              .eq('user_id', profile.id)
              .maybeSingle()
            if (currentSub?.explicacao_pratica) explicacaoPratica = true
          } catch {}
        }

        if (!explicacaoPratica) {
          // Buscar nome do produto na API do Stripe
          try {
            const productId =
              typeof item.price.product === 'string' ? item.price.product : undefined
            if (productId) {
              const product = await stripe.products.retrieve(productId)
              if (product.name.toLowerCase().includes('plus')) {
                explicacaoPratica = true
              }
            }
          } catch (err) {}
        }

        // Se cancelar, explicacao_pratica deve ser false
        if (incomingStatus === 'canceled') {
          explicacaoPratica = false
        }

        console.log('Explicação Prática final:', explicacaoPratica)

        const now = new Date().toISOString()

        // ───────────────── Datas de período ─────────────────
        const currentPeriodStart = (subscription as any).current_period_start
          ? new Date((subscription as any).current_period_start * 1000).toISOString()
          : null
        const currentPeriodEnd = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : null

        console.log('Current Period Start:', currentPeriodStart)
        console.log('Current Period End:', currentPeriodEnd)

        // ───────────────── Cancelar outras assinaturas ativas do usuário ─────────────────
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('user_id', profile.id)
          .neq('subscription_id', subscription.id)
          .eq('status', 'active')

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
