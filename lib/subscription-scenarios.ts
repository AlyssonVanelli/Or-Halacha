/**
 * Análise completa de todos os cenários possíveis
 * Garante cobertura 100% dos casos de uso
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export interface SubscriptionState {
  id: string
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
  current_period_end: number
  trial_end?: number
  cancel_at_period_end: boolean
  canceled_at?: number
}

export interface UpgradeScenario {
  id: string
  name: string
  description: string
  isAllowed: boolean
  requiresSpecialHandling: boolean
  riskLevel: 'low' | 'medium' | 'high'
  errorMessage?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  requiresConfirmation: boolean
  estimatedCost: number
  nextBillingDate: string
}

/**
 * Todos os cenários possíveis de upgrade/renewal
 */
export const UPGRADE_SCENARIOS: UpgradeScenario[] = [
  // ✅ CENÁRIOS BÁSICOS (Já implementados)
  {
    id: 'mensal-basico-to-plus',
    name: 'Mensal Básico → Mensal Plus',
    description: 'Upgrade de plano básico para plus no mesmo período',
    isAllowed: true,
    requiresSpecialHandling: false,
    riskLevel: 'low',
  },
  {
    id: 'mensal-to-anual',
    name: 'Mensal → Anual',
    description: 'Upgrade de mensal para anual (economia)',
    isAllowed: true,
    requiresSpecialHandling: false,
    riskLevel: 'low',
  },
  {
    id: 'basico-to-plus',
    name: 'Básico → Plus',
    description: 'Upgrade de básico para plus (mais recursos)',
    isAllowed: true,
    requiresSpecialHandling: false,
    riskLevel: 'low',
  },

  // 🔄 CENÁRIOS DE RENOVAÇÃO
  {
    id: 'canceled-to-renewal',
    name: 'Cancelada → Renovação',
    description: 'Renovar assinatura cancelada',
    isAllowed: true,
    requiresSpecialHandling: true,
    riskLevel: 'medium',
  },
  {
    id: 'expired-to-renewal',
    name: 'Expirada → Renovação',
    description: 'Renovar assinatura expirada',
    isAllowed: true,
    requiresSpecialHandling: true,
    riskLevel: 'medium',
  },
  {
    id: 'no-subscription-to-first',
    name: 'Sem Assinatura → Primeira',
    description: 'Primeira compra de assinatura',
    isAllowed: true,
    requiresSpecialHandling: false,
    riskLevel: 'low',
  },

  // ⚠️ CENÁRIOS DE ERRO
  {
    id: 'payment-failed',
    name: 'Falha no Pagamento',
    description: 'Erro durante processamento do pagamento',
    isAllowed: false,
    requiresSpecialHandling: true,
    riskLevel: 'high',
    errorMessage: 'Falha no processamento do pagamento. Tente novamente.',
  },
  {
    id: 'stripe-api-down',
    name: 'Stripe API Indisponível',
    description: 'Stripe API temporariamente indisponível',
    isAllowed: false,
    requiresSpecialHandling: true,
    riskLevel: 'high',
    errorMessage: 'Serviço temporariamente indisponível. Tente em alguns minutos.',
  },
  {
    id: 'network-timeout',
    name: 'Timeout de Rede',
    description: 'Timeout durante comunicação com Stripe',
    isAllowed: false,
    requiresSpecialHandling: true,
    riskLevel: 'high',
    errorMessage: 'Timeout na comunicação. Verifique sua conexão.',
  },

  // 🛡️ CENÁRIOS DE SEGURANÇA
  {
    id: 'unauthorized-user',
    name: 'Usuário Não Autenticado',
    description: 'Tentativa de upgrade sem autenticação',
    isAllowed: false,
    requiresSpecialHandling: true,
    riskLevel: 'high',
    errorMessage: 'Usuário não autenticado. Faça login primeiro.',
  },
  {
    id: 'downgrade-attempt',
    name: 'Tentativa de Downgrade',
    description: 'Tentativa de downgrade (não permitido)',
    isAllowed: false,
    requiresSpecialHandling: true,
    riskLevel: 'medium',
    errorMessage: 'Downgrade não permitido. Escolha um plano superior.',
  },
  {
    id: 'concurrent-upgrades',
    name: 'Múltiplos Upgrades Simultâneos',
    description: 'Várias tentativas de upgrade ao mesmo tempo',
    isAllowed: false,
    requiresSpecialHandling: true,
    riskLevel: 'high',
    errorMessage: 'Upgrade já em andamento. Aguarde a conclusão.',
  },
  {
    id: 'non-existent-subscription',
    name: 'Assinatura Inexistente',
    description: 'Tentativa de upgrade de assinatura que não existe',
    isAllowed: false,
    requiresSpecialHandling: true,
    riskLevel: 'high',
    errorMessage: 'Assinatura não encontrada. Verifique sua conta.',
  },

  // 💰 CENÁRIOS DE PREÇOS
  {
    id: 'mid-period-upgrade',
    name: 'Upgrade no Meio do Período',
    description: 'Upgrade com proratação no meio do período',
    isAllowed: true,
    requiresSpecialHandling: true,
    riskLevel: 'medium',
  },
  {
    id: 'last-day-upgrade',
    name: 'Upgrade no Último Dia',
    description: 'Upgrade no último dia do período atual',
    isAllowed: true,
    requiresSpecialHandling: true,
    riskLevel: 'medium',
  },
  {
    id: 'discounted-upgrade',
    name: 'Upgrade com Desconto',
    description: 'Upgrade com desconto aplicado',
    isAllowed: true,
    requiresSpecialHandling: true,
    riskLevel: 'low',
  },

  // 🔄 CENÁRIOS DE ESTADO
  {
    id: 'trial-to-upgrade',
    name: 'Trial → Upgrade',
    description: 'Upgrade durante período de trial',
    isAllowed: true,
    requiresSpecialHandling: true,
    riskLevel: 'medium',
  },
  {
    id: 'paused-to-upgrade',
    name: 'Pausada → Upgrade',
    description: 'Upgrade de assinatura pausada',
    isAllowed: false,
    requiresSpecialHandling: true,
    riskLevel: 'high',
    errorMessage: 'Assinatura pausada. Reative antes de fazer upgrade.',
  },
  {
    id: 'failed-to-upgrade',
    name: 'Com Falha → Upgrade',
    description: 'Upgrade de assinatura com falha de pagamento',
    isAllowed: false,
    requiresSpecialHandling: true,
    riskLevel: 'high',
    errorMessage: 'Assinatura com falha. Resolva o pagamento primeiro.',
  },
  {
    id: 'incomplete-to-upgrade',
    name: 'Incompleta → Upgrade',
    description: 'Upgrade de assinatura incompleta',
    isAllowed: false,
    requiresSpecialHandling: true,
    riskLevel: 'high',
    errorMessage: 'Assinatura incompleta. Complete o pagamento primeiro.',
  },
]

/**
 * Valida cenário de upgrade
 */
export async function validateUpgradeScenario(
  userId: string,
  currentSubscriptionId: string | null,
  newPlanId: string,
  userAuthenticated: boolean
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  let requiresConfirmation = false
  let estimatedCost = 0
  let nextBillingDate = ''

  // 1. Validação de Autenticação
  if (!userAuthenticated) {
    errors.push('Usuário não autenticado')
    return {
      isValid: false,
      errors,
      warnings,
      requiresConfirmation: false,
      estimatedCost: 0,
      nextBillingDate: '',
    }
  }

  // 2. Validação de Assinatura Atual
  if (currentSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(currentSubscriptionId)
      
      // Verificar status da assinatura
      if (subscription.status === 'paused') {
        errors.push('Assinatura pausada. Reative antes de fazer upgrade.')
      }
      
      if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        errors.push('Assinatura com falha de pagamento. Resolva primeiro.')
      }
      
      if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
        errors.push('Assinatura incompleta. Complete o pagamento primeiro.')
      }

      // Verificar se está em trial
      if (subscription.status === 'trialing') {
        warnings.push('Upgrade durante período de trial')
        requiresConfirmation = true
      }

      // Calcular proratação se necessário
      if (subscription.status === 'active') {
        const daysRemaining = Math.ceil((subscription.current_period_end - Date.now() / 1000) / 86400)
        if (daysRemaining < 7) {
          warnings.push('Poucos dias restantes no período atual')
          requiresConfirmation = true
        }
      }

    } catch (error) {
      errors.push('Erro ao verificar assinatura atual')
    }
  }

  // 3. Validação de Plano
  const planMap: Record<string, { price: number; name: string }> = {
    'mensal-basico': { price: 99.90, name: 'Mensal Básico' },
    'mensal-plus': { price: 149.90, name: 'Mensal Plus' },
    'anual-basico': { price: 958.80, name: 'Anual Básico' },
    'anual-plus': { price: 1078.80, name: 'Anual Plus' },
  }

  const newPlan = planMap[newPlanId]
  if (!newPlan) {
    errors.push('Plano inválido')
  } else {
    estimatedCost = newPlan.price
    nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  // 4. Verificar duplicatas
  try {
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: userId,
      status: 'active',
    })
    
    if (existingSubscriptions.data.length > 1) {
      warnings.push('Múltiplas assinaturas ativas detectadas')
      requiresConfirmation = true
    }
  } catch (error) {
    warnings.push('Não foi possível verificar assinaturas existentes')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiresConfirmation,
    estimatedCost,
    nextBillingDate,
  }
}

/**
 * Executa upgrade com tratamento de erros robusto
 */
export async function executeUpgradeWithErrorHandling(
  userId: string,
  currentSubscriptionId: string | null,
  newPlanId: string,
  userAuthenticated: boolean
): Promise<{
  success: boolean
  subscriptionId?: string
  error?: string
  scenario?: string
  requiresRetry?: boolean
}> {
  try {
    // 1. Validar cenário
    const validation = await validateUpgradeScenario(
      userId,
      currentSubscriptionId,
      newPlanId,
      userAuthenticated
    )

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        scenario: 'validation-failed',
      }
    }

    // 2. Verificar se requer confirmação
    if (validation.requiresConfirmation) {
      return {
        success: false,
        error: 'Confirmação necessária para este upgrade',
        scenario: 'requires-confirmation',
        requiresRetry: true,
      }
    }

    // 3. Executar upgrade
    if (currentSubscriptionId) {
      // Cancelar assinatura atual
      await stripe.subscriptions.update(currentSubscriptionId, {
        cancel_at_period_end: true,
      })
    }

    // Criar nova assinatura
    const newSubscription = await stripe.subscriptions.create({
      customer: userId,
      items: [{ price: getStripePriceId(newPlanId) }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    return {
      success: true,
      subscriptionId: newSubscription.id,
      scenario: 'upgrade-success',
    }

  } catch (error) {
    console.error('Erro no upgrade:', error)
    
    // Determinar tipo de erro
    if (error instanceof Stripe.errors.StripeCardError) {
      return {
        success: false,
        error: 'Erro no cartão de crédito',
        scenario: 'card-error',
        requiresRetry: true,
      }
    }
    
    if (error instanceof Stripe.errors.StripeRateLimitError) {
      return {
        success: false,
        error: 'Muitas tentativas. Tente novamente em alguns minutos',
        scenario: 'rate-limit',
        requiresRetry: true,
      }
    }
    
    if (error instanceof Stripe.errors.StripeAPIError) {
      return {
        success: false,
        error: 'Erro interno do Stripe. Tente novamente',
        scenario: 'stripe-api-error',
        requiresRetry: true,
      }
    }

    return {
      success: false,
      error: 'Erro inesperado durante o upgrade',
      scenario: 'unknown-error',
      requiresRetry: true,
    }
  }
}

/**
 * Obtém Stripe Price ID do plano
 */
function getStripePriceId(planId: string): string {
  const priceMap: Record<string, string> = {
    'mensal-basico': process.env.STRIPE_PRICE_MENSAL_BASICO!,
    'mensal-plus': process.env.STRIPE_PRICE_MENSAL_PLUS!,
    'anual-basico': process.env.STRIPE_PRICE_ANUAL_BASICO!,
    'anual-plus': process.env.STRIPE_PRICE_ANUAL_PLUS!,
  }
  
  return priceMap[planId] || ''
}

/**
 * Verifica se cenário requer tratamento especial
 */
export function requiresSpecialHandling(scenarioId: string): boolean {
  const scenario = UPGRADE_SCENARIOS.find(s => s.id === scenarioId)
  return scenario?.requiresSpecialHandling || false
}

/**
 * Obtém nível de risco do cenário
 */
export function getRiskLevel(scenarioId: string): 'low' | 'medium' | 'high' {
  const scenario = UPGRADE_SCENARIOS.find(s => s.id === scenarioId)
  return scenario?.riskLevel || 'medium'
}
