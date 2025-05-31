import Stripe from 'stripe'

// Tipos para os produtos e preços
export const STRIPE_PRODUCTS = {
  MONTHLY_SUBSCRIPTION: 'price_monthly', // Substituir pelo price_id real
  YEARLY_SUBSCRIPTION: 'price_yearly', // Substituir pelo price_id real
  SINGLE_BOOK: 'price_single_book', // Substituir pelo price_id real
} as const

export type StripeProductType = keyof typeof STRIPE_PRODUCTS

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não está definida')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
})

// Funções para criar sessões de checkout
export async function createCheckoutSession(
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
      ...metadata,
    },
  })

  return session
}

// Função para criar sessão de compra de livro avulso
export async function createSingleBookCheckoutSession(
  bookId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: STRIPE_PRODUCTS.SINGLE_BOOK,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
      bookId,
      type: 'single_book',
    },
  })

  return session
}

// Função para cancelar assinatura
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  return subscription
}

// Função para verificar status da assinatura
export async function getSubscriptionStatus(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}
