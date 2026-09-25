import Stripe from 'stripe'

// Configuração do Stripe - apenas no servidor
let stripe: Stripe | null = null

if (typeof window === 'undefined' && process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil',
    typescript: true,
  })
}

export { stripe }

// Tipos de planos disponíveis
export const PLAN_TYPES = {
  // Assinaturas mensais
  MONTHLY_BASIC: 'mensal-basico',
  MONTHLY_PLUS: 'mensal-plus',

  // Assinaturas anuais
  YEARLY_BASIC: 'anual-basico',
  YEARLY_PLUS: 'anual-plus',

  // Compra avulsa
  SINGLE_BOOK: 'tratado-avulso',
} as const

export type PlanType = (typeof PLAN_TYPES)[keyof typeof PLAN_TYPES]

// Mapeamento dos planos para price IDs do Stripe
export const PLAN_PRICE_IDS: Record<PlanType, string> = {
  [PLAN_TYPES.MONTHLY_BASIC]: process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL || '',
  [PLAN_TYPES.MONTHLY_PLUS]: process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS || '',
  [PLAN_TYPES.YEARLY_BASIC]: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL || '',
  [PLAN_TYPES.YEARLY_PLUS]: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS || '',
  [PLAN_TYPES.SINGLE_BOOK]: process.env.NEXT_PUBLIC_STRIPE_PRICE_SINGLE_BOOK || '',
}

// Validação dos price IDs
export function validatePriceIds(): void {
  const missingIds = Object.entries(PLAN_PRICE_IDS)
    .filter(([, priceId]) => !priceId)
    .map(([planType]) => planType)

  if (missingIds.length > 0) {
    throw new Error(`Price IDs não configurados para: ${missingIds.join(', ')}`)
  }
}

// Função para criar ou buscar customer no Stripe
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  if (!stripe) {
    throw new Error('Stripe não está configurado')
  }

  try {
    // Primeiro, tentar buscar customer existente
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0]
    }

    // Se não existir, criar novo customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    })

    return customer
  } catch (error) {
    console.error('Erro ao criar/buscar customer:', error)
    throw new Error('Erro ao configurar cliente no sistema de pagamento')
  }
}

// Retorna o stripe_customer_id do usuário autenticado, criando o customer se necessário.
// Grava no profile com service role (o usuário não pode alterar stripe_customer_id via RLS).
export async function ensureStripeCustomerId(user: { id: string; email?: string }) {
  if (!stripe) {
    throw new Error('Stripe não está configurado')
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.stripe_customer_id) {
    // O customer salvo pode não existir nesta conta Stripe (criado em modo teste, apagado
    // manualmente etc.). Nesse caso cria um novo em vez de quebrar o checkout.
    try {
      const existing = await stripe.customers.retrieve(profile.stripe_customer_id)
      if (!('deleted' in existing && existing.deleted)) {
        return profile.stripe_customer_id
      }
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code !== 'resource_missing') throw err
    }
    console.warn('stripe_customer_id inválido no perfil; criando novo customer', user.id)
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user.id },
  })

  const { error } = await admin.from('profiles').upsert({
    id: user.id,
    stripe_customer_id: customer.id,
    updated_at: new Date().toISOString(),
  })
  if (error) {
    console.error('Erro ao salvar stripe_customer_id:', error.message)
  }

  return customer.id
}

/**
 * Confere se o preço do Stripe tem o intervalo do plano (anual → year, mensal → month).
 * Retorna uma mensagem de erro se estiver mal configurado; null se estiver ok.
 */
export function planIntervalError(planType: string, price: Stripe.Price): string | null {
  const expected = planType.startsWith('anual')
    ? 'year'
    : planType.startsWith('mensal')
      ? 'month'
      : null
  if (!expected || price.recurring?.interval === expected) return null
  return `Preço ${price.id} do plano ${planType} está com intervalo "${price.recurring?.interval}", esperado "${expected}"`
}

// Reembolsa o último pagamento de uma assinatura e a cancela imediatamente no Stripe.
export async function refundAndCancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe não está configurado')
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const invoiceId = subscription.latest_invoice as string | null
  if (!invoiceId) {
    throw new Error('Assinatura sem fatura para reembolsar')
  }

  const invoice = (await stripe.invoices.retrieve(invoiceId)) as unknown as Record<string, unknown>
  let paymentIntent = invoice['payment_intent'] as string | undefined

  // API 2025-03-31+ (basil): payment_intent saiu da invoice e fica em invoice payments
  if (!paymentIntent) {
    const client = stripe as unknown as {
      invoicePayments?: {
        list: (p: { invoice: string; limit: number }) => Promise<{
          data: Array<{ payment?: { payment_intent?: string } }>
        }>
      }
    }
    const payments = await client.invoicePayments?.list({ invoice: invoiceId, limit: 1 })
    paymentIntent = payments?.data[0]?.payment?.payment_intent
  }

  if (!paymentIntent) {
    throw new Error('Pagamento da assinatura não encontrado')
  }

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntent,
    reason: 'requested_by_customer',
  })

  await stripe.subscriptions.cancel(subscriptionId)

  return refund
}

// Função para criar sessão de checkout para assinatura
export async function createSubscriptionCheckoutSession({
  priceId,
  customerId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  priceId: string
  customerId: string
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error('Stripe não está configurado')
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        userId,
        userEmail,
        ...metadata,
      },
      subscription_data: {
        metadata: {
          userId,
          userEmail,
          ...metadata,
        },
      },
    })

    return session
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    throw new Error('Erro ao criar sessão de pagamento')
  }
}

// Função para criar sessão de checkout para compra avulsa
export async function createSinglePurchaseCheckoutSession({
  priceId,
  customerId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  priceId: string
  customerId: string
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error('Stripe não está configurado')
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        userId,
        userEmail,
        type: 'single_purchase',
        ...metadata,
      },
    })

    return session
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    throw new Error('Erro ao criar sessão de pagamento')
  }
}

// Função para buscar assinatura no Stripe
export async function getStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe não está configurado')
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error)
    throw new Error('Erro ao buscar assinatura')
  }
}

// Função para cancelar assinatura
export async function cancelStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe não está configurado')
  }

  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
    return subscription
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    throw new Error('Erro ao cancelar assinatura')
  }
}

// Função para reativar assinatura cancelada
export async function reactivateStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe não está configurado')
  }

  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
    return subscription
  } catch (error) {
    console.error('Erro ao reativar assinatura:', error)
    throw new Error('Erro ao reativar assinatura')
  }
}

// Função para verificar se um price ID é válido
export async function validatePriceId(priceId: string): Promise<boolean> {
  if (!stripe) {
    return false
  }

  try {
    await stripe.prices.retrieve(priceId)
    return true
  } catch {
    return false
  }
}

// Função para obter informações do price
export async function getPriceInfo(priceId: string): Promise<Stripe.Price> {
  if (!stripe) {
    throw new Error('Stripe não está configurado')
  }

  try {
    const price = await stripe.prices.retrieve(priceId)
    return price
  } catch (error) {
    console.error('Erro ao buscar informações do preço:', error)
    throw new Error('Erro ao buscar informações do preço')
  }
}
