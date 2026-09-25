import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Lógica única para gravar uma assinatura do Stripe na tabela `subscriptions`.
// Usada pelo webhook e pela sincronização pós-checkout. Somente servidor.

type AdminClient = ReturnType<typeof createAdminClient>

const STATUS_ORDER: Record<string, number> = {
  incomplete: 0,
  trialing: 1,
  active: 2,
  past_due: 3,
  unpaid: 4,
  canceled: 5,
  incomplete_expired: 6,
}

export const toIso = (ts: unknown) =>
  typeof ts === 'number' && ts > 0 ? new Date(ts * 1000).toISOString() : null

async function findUserId(
  supabase: AdminClient,
  customerId: string,
  metadataUserId?: string
): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (profile) return profile.id
  // userId no metadata é definido pelo servidor a partir da sessão autenticada
  return metadataUserId || null
}

async function isPlusSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<boolean> {
  const meta = subscription.metadata || {}
  if (meta.isPlus === 'true' || (meta.planType || '').toLowerCase().includes('plus')) {
    return true
  }

  try {
    const sessions = await stripe.checkout.sessions.list({
      subscription: subscription.id,
      limit: 1,
    })
    const sessionMeta = sessions.data[0]?.metadata || {}
    if (
      sessionMeta.isPlus === 'true' ||
      (sessionMeta.planType || '').toLowerCase().includes('plus')
    ) {
      return true
    }
  } catch (err) {
    console.error('Erro ao buscar checkout session da assinatura', err)
  }

  const price = subscription.items.data[0]?.price
  const plusPriceIds = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS,
  ].filter(Boolean)
  if (price && plusPriceIds.includes(price.id)) return true

  const productName =
    typeof price?.product === 'object' && price.product && 'name' in price.product
      ? String(price.product.name)
      : ''
  return [price?.id, price?.nickname, productName].some(v =>
    (v || '').toLowerCase().includes('plus')
  )
}

export async function saveStripeSubscription(
  stripe: Stripe,
  supabase: AdminClient,
  subscription: Stripe.Subscription,
  isCreated: boolean
) {
  const customerId = subscription.customer as string
  const userId = await findUserId(supabase, customerId, subscription.metadata?.userId)
  if (!userId) {
    console.warn('Usuário não encontrado para customer', customerId)
    return
  }

  const { data: currentSub } = await supabase
    .from('subscriptions')
    .select('status, subscription_id')
    .eq('user_id', userId)
    .maybeSingle()

  // Eventos podem chegar fora de ordem: não regredir status da mesma assinatura
  const currentOrder = STATUS_ORDER[currentSub?.status || 'incomplete'] ?? 0
  const incomingOrder = STATUS_ORDER[subscription.status] ?? 0
  if (currentSub?.subscription_id === subscription.id && incomingOrder < currentOrder) {
    return
  }

  const item = subscription.items.data[0]
  if (!item?.price) {
    console.warn('Assinatura sem price', subscription.id)
    return
  }

  const planType = item.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'
  const explicacaoPratica =
    subscription.status === 'canceled' ? false : await isPlusSubscription(stripe, subscription)

  const sub = subscription as unknown as Record<string, unknown>
  let currentPeriodStart = toIso(item.current_period_start) || toIso(sub['current_period_start'])
  let currentPeriodEnd = toIso(item.current_period_end) || toIso(sub['current_period_end'])
  if (!currentPeriodStart || !currentPeriodEnd) {
    const now = Date.now()
    const days = planType === 'yearly' ? 365 : 30
    currentPeriodStart = new Date(now).toISOString()
    currentPeriodEnd = new Date(now + days * 24 * 60 * 60 * 1000).toISOString()
  }

  const now = new Date().toISOString()

  if (subscription.status !== 'canceled') {
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', userId)
      .neq('subscription_id', subscription.id)
      .eq('status', 'active')
  }

  const data: Record<string, unknown> = {
    user_id: userId,
    status: subscription.status,
    plan_type: planType,
    price_id: item.price.id,
    subscription_id: subscription.id,
    cancel_at_period_end: subscription.cancel_at_period_end,
    explicacao_pratica: explicacaoPratica,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    updated_at: now,
  }
  // created_at marca o início da assinatura atual (usado no prazo de reembolso de 7 dias)
  if (isCreated || currentSub?.subscription_id !== subscription.id) data['created_at'] = now

  const { error } = await supabase
    .from('subscriptions')
    .upsert([data] as never, { onConflict: 'user_id' })
  if (error) {
    console.error('Erro ao salvar assinatura', subscription.id, error.message)
    throw new Error('Falha ao salvar assinatura')
  }
}
