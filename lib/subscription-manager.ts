/**
 * Gerenciador inteligente de assinaturas
 * Resolve todos os cenários de upgrade/renewal sem duplicação
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  isPlus: boolean
  stripePriceId: string
}

export interface UpgradeOptions {
  currentPlan: SubscriptionPlan | null
  availableUpgrades: SubscriptionPlan[]
  isUpgrade: boolean
  isRenewal: boolean
}

export interface PricingCalculation {
  currentPlan: SubscriptionPlan | null
  newPlan: SubscriptionPlan
  prorationAmount: number
  immediateCharge: number
  nextBillingDate: string
  savings: number
}

/**
 * Planos disponíveis (em ordem hierárquica)
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'mensal-basico',
    name: 'Mensal Básico',
    price: 99.90,
    interval: 'month',
    isPlus: false,
    stripePriceId: process.env.STRIPE_PRICE_MENSAL_BASICO!,
  },
  {
    id: 'mensal-plus',
    name: 'Mensal Plus',
    price: 149.90,
    interval: 'month',
    isPlus: true,
    stripePriceId: process.env.STRIPE_PRICE_MENSAL_PLUS!,
  },
  {
    id: 'anual-basico',
    name: 'Anual Básico',
    price: 958.80,
    interval: 'year',
    isPlus: false,
    stripePriceId: process.env.STRIPE_PRICE_ANUAL_BASICO!,
  },
  {
    id: 'anual-plus',
    name: 'Anual Plus',
    price: 1078.80,
    interval: 'year',
    isPlus: true,
    stripePriceId: process.env.STRIPE_PRICE_ANUAL_PLUS!,
  },
]

/**
 * Determina se um upgrade é válido
 */
export function isValidUpgrade(currentPlan: SubscriptionPlan | null, newPlan: SubscriptionPlan): boolean {
  if (!currentPlan) return true // Sem assinatura atual = renovação válida

  // Mesmo plano = não é upgrade
  if (currentPlan.id === newPlan.id) return false

  // Upgrade de mensal para anual = sempre válido (economia)
  if (currentPlan.interval === 'month' && newPlan.interval === 'year') return true

  // Upgrade de básico para plus = sempre válido
  if (!currentPlan.isPlus && newPlan.isPlus) return true

  // Upgrade de mensal plus para anual = sempre válido
  if (currentPlan.id === 'mensal-plus' && newPlan.interval === 'year') return true

  // Downgrade = não permitido
  if (currentPlan.interval === 'year' && newPlan.interval === 'month') return false
  if (currentPlan.isPlus && !newPlan.isPlus) return false

  return true
}

/**
 * Calcula opções de upgrade disponíveis
 */
export function getUpgradeOptions(currentPlan: SubscriptionPlan | null): UpgradeOptions {
  const availableUpgrades = SUBSCRIPTION_PLANS.filter(plan => 
    isValidUpgrade(currentPlan, plan)
  )

  return {
    currentPlan,
    availableUpgrades,
    isUpgrade: currentPlan !== null,
    isRenewal: currentPlan === null,
  }
}

/**
 * Calcula preços com proratação
 */
export async function calculatePricing(
  currentSubscription: Stripe.Subscription | null,
  newPlan: SubscriptionPlan
): Promise<PricingCalculation> {
  const currentPlan = currentSubscription 
    ? SUBSCRIPTION_PLANS.find(p => p.stripePriceId === currentSubscription.items.data[0].price.id)
    : null

  if (!currentSubscription) {
    // Renovação - preço cheio
    return {
      currentPlan: null,
      newPlan,
      prorationAmount: 0,
      immediateCharge: newPlan.price,
      nextBillingDate: new Date(Date.now() + (newPlan.interval === 'month' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
      savings: 0,
    }
  }

  // Upgrade - calcular proratação
  const prorationResult = await stripe.subscriptions.update(currentSubscription.id, {
    items: [{
      id: currentSubscription.items.data[0].id,
      price: newPlan.stripePriceId,
    }],
    proration_behavior: 'create_prorations',
  })

  const prorationAmount = Math.abs(prorationResult.latest_invoice?.amount_due || 0) / 100
  const nextBillingDate = new Date(prorationResult.current_period_end * 1000).toISOString()
  
  // Calcular economia (se aplicável)
  let savings = 0
  if (currentPlan && currentPlan.interval === 'month' && newPlan.interval === 'year') {
    const monthlyEquivalent = newPlan.price / 12
    const monthlyDifference = currentPlan.price - monthlyEquivalent
    savings = monthlyDifference * 12
  }

  return {
    currentPlan,
    newPlan,
    prorationAmount,
    immediateCharge: prorationAmount,
    nextBillingDate,
    savings,
  }
}

/**
 * Executa upgrade de assinatura
 */
export async function executeUpgrade(
  customerId: string,
  currentSubscriptionId: string | null,
  newPlan: SubscriptionPlan
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    if (currentSubscriptionId) {
      // Cancelar assinatura atual
      await stripe.subscriptions.update(currentSubscriptionId, {
        cancel_at_period_end: true,
      })
    }

    // Criar nova assinatura
    const newSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: newPlan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    return {
      success: true,
      subscriptionId: newSubscription.id,
    }
  } catch (error) {
    console.error('Erro no upgrade:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Executa renovação de assinatura
 */
export async function executeRenewal(
  customerId: string,
  newPlan: SubscriptionPlan
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    const newSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: newPlan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    return {
      success: true,
      subscriptionId: newSubscription.id,
    }
  } catch (error) {
    console.error('Erro na renovação:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Verifica se há assinaturas duplicadas
 */
export async function checkDuplicateSubscriptions(customerId: string): Promise<{
  hasDuplicates: boolean
  activeSubscriptions: Stripe.Subscription[]
  duplicateIds: string[]
}> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
  })

  const activeSubscriptions = subscriptions.data
  const hasDuplicates = activeSubscriptions.length > 1
  const duplicateIds = hasDuplicates ? activeSubscriptions.map(sub => sub.id) : []

  return {
    hasDuplicates,
    activeSubscriptions,
    duplicateIds,
  }
}

/**
 * Limpa assinaturas duplicadas
 */
export async function cleanupDuplicateSubscriptions(
  customerId: string,
  keepSubscriptionId: string
): Promise<{ success: boolean; cancelledIds: string[]; error?: string }> {
  try {
    const { activeSubscriptions } = await checkDuplicateSubscriptions(customerId)
    const toCancel = activeSubscriptions.filter(sub => sub.id !== keepSubscriptionId)
    
    const cancelledIds: string[] = []
    
    for (const subscription of toCancel) {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      })
      cancelledIds.push(subscription.id)
    }

    return {
      success: true,
      cancelledIds,
    }
  } catch (error) {
    console.error('Erro na limpeza:', error)
    return {
      success: false,
      cancelledIds: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
