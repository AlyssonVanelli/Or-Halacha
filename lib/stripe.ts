import Stripe from 'stripe'

// Configuração do Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não está definida nas variáveis de ambiente')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
})

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
    .filter(([_, priceId]) => !priceId)
    .map(([planType, _]) => planType)

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
  try {
    await stripe.prices.retrieve(priceId)
    return true
  } catch {
    return false
  }
}

// Função para obter informações do price
export async function getPriceInfo(priceId: string): Promise<Stripe.Price> {
  try {
    const price = await stripe.prices.retrieve(priceId)
    return price
  } catch (error) {
    console.error('Erro ao buscar informações do preço:', error)
    throw new Error('Erro ao buscar informações do preço')
  }
}
