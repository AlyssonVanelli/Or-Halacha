// Catálogo de planos exibido no site (home, /planos, dashboard, perfil, políticas).
// O valor efetivamente cobrado é o configurado na Hotmart — mantenha os dois iguais.

export type PlanId = 'mensal-basico' | 'mensal-plus' | 'anual-basico' | 'anual-plus'

export interface Plan {
  id: PlanId
  name: string
  interval: 'month' | 'year'
  plus: boolean
  price: number
}

export const PLANS: Record<PlanId, Plan> = {
  'mensal-basico': {
    id: 'mensal-basico',
    name: 'Mensal Básico',
    interval: 'month',
    plus: false,
    price: 99.9,
  },
  'mensal-plus': {
    id: 'mensal-plus',
    name: 'Mensal Plus',
    interval: 'month',
    plus: true,
    price: 119.9,
  },
  'anual-basico': {
    id: 'anual-basico',
    name: 'Anual Básico',
    interval: 'year',
    plus: false,
    price: 799,
  },
  'anual-plus': {
    id: 'anual-plus',
    name: 'Anual Plus',
    interval: 'year',
    plus: true,
    price: 959,
  },
}

export const PLAN_ORDER: PlanId[] = ['mensal-basico', 'anual-basico', 'mensal-plus', 'anual-plus']

/** Tratado avulso: pagamento único, acesso a 1 tratado por 1 mês. */
export const TREATISE_PRICE = 29.9

/** Garantia (direito de arrependimento): reembolso integral pela Hotmart. */
export const REFUND_DAYS = 7

/** Área do comprador da Hotmart: cancelar renovação, trocar cartão/plano, pedir reembolso. */
export const HOTMART_BUYER_AREA_URL = 'https://consumer.hotmart.com'

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && value in PLANS
}

export function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Plano mensal equivalente (mesmo nível: Básico ou Plus). */
export function monthlyCounterpart(plan: Plan): Plan {
  return PLANS[plan.plus ? 'mensal-plus' : 'mensal-basico']
}

/** Quanto o plano anual economiza em relação a 12 mensalidades. */
export function annualSavings(plan: Plan) {
  return Math.round((monthlyCounterpart(plan).price * 12 - plan.price) * 100) / 100
}

/** Meses "de graça" do anual em relação ao mensal (ex.: 4). */
export function annualFreeMonths(plan: Plan) {
  return Math.round(annualSavings(plan) / monthlyCounterpart(plan).price)
}

/** Preço por mês do anual, só como referência (a cobrança é única, à vista). */
export function perMonth(plan: Plan) {
  return Math.floor((plan.price / 12) * 100) / 100
}

export function planFromSubscription(sub: {
  plan_type?: string | null
  explicacao_pratica?: boolean | null
}): Plan {
  const yearly = sub.plan_type === 'yearly'
  const plus = !!sub.explicacao_pratica
  return PLANS[
    yearly ? (plus ? 'anual-plus' : 'anual-basico') : plus ? 'mensal-plus' : 'mensal-basico'
  ]
}
