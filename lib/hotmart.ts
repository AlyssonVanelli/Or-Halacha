import { timingSafeEqual } from 'crypto'
import { isPlanId, type PlanId } from '@/lib/plans'
import { TREATISES, treatiseById, type Treatise } from '@/lib/content/divisions'

// Integração com a Hotmart — SOMENTE servidor.
//
// Cada plano e cada tratado tem um link de checkout próprio, copiado do painel da Hotmart
// (Produto → Precificação/Ofertas) para uma variável de ambiente. O código da oferta (off=...)
// desse link é o que identifica o produto quando o webhook avisa da compra.

const PLAN_ENV: Record<PlanId, string> = {
  'mensal-basico': 'HOTMART_CHECKOUT_MENSAL',
  'mensal-plus': 'HOTMART_CHECKOUT_MENSAL_PLUS',
  'anual-basico': 'HOTMART_CHECKOUT_ANUAL',
  'anual-plus': 'HOTMART_CHECKOUT_ANUAL_PLUS',
}

const treatiseEnv = (t: Treatise) => `HOTMART_CHECKOUT_TRATADO_${t.code}`

export type CheckoutItem = { kind: 'plan'; plan: PlanId } | { kind: 'treatise'; treatise: Treatise }

/** Valor guardado em payment_events.item: id do plano ou id do tratado. */
export function itemKey(item: CheckoutItem) {
  return item.kind === 'plan' ? item.plan : item.treatise.id
}

/** "/checkout/<plano ou id do tratado>" → item. */
export function parseCheckoutItem(value: string): CheckoutItem | null {
  if (isPlanId(value)) return { kind: 'plan', plan: value }
  const treatise = treatiseById(value)
  return treatise ? { kind: 'treatise', treatise } : null
}

function envUrl(name: string): URL | null {
  const raw = process.env[name]?.trim()
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

function checkoutBaseUrl(item: CheckoutItem): URL | null {
  return envUrl(item.kind === 'plan' ? PLAN_ENV[item.plan] : treatiseEnv(item.treatise))
}

/**
 * Link de pagamento da Hotmart para a conta logada: e-mail e nome já preenchidos e o id da
 * conta em xcod/sck, que voltam no webhook (purchase.origin) para liberar o acesso certo.
 */
export function buildCheckoutUrl(
  item: CheckoutItem,
  buyer: { id: string; email?: string | null; name?: string | null }
): string | null {
  const url = checkoutBaseUrl(item)
  if (!url) return null
  url.searchParams.set('xcod', buyer.id)
  url.searchParams.set('sck', buyer.id)
  if (buyer.email) url.searchParams.set('email', buyer.email)
  if (buyer.name) url.searchParams.set('name', buyer.name)
  return url.toString()
}

/** Código da oferta comprada → plano/tratado, comparando com o off= dos links configurados. */
export function itemFromOfferCode(code: string | null | undefined): CheckoutItem | null {
  if (!code) return null
  for (const plan of Object.keys(PLAN_ENV) as PlanId[]) {
    if (envUrl(PLAN_ENV[plan])?.searchParams.get('off') === code) return { kind: 'plan', plan }
  }
  for (const treatise of TREATISES) {
    if (envUrl(treatiseEnv(treatise))?.searchParams.get('off') === code) {
      return { kind: 'treatise', treatise }
    }
  }
  return null
}

const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’`]/g, '').toLowerCase()

/**
 * Último recurso: o nome do plano/oferta cadastrado na Hotmart ("Anual Plus",
 * "Tratado Orach Chayim"). Evita perder uma venda se um link estiver sem off= na Vercel.
 */
export function itemFromNames(names: Array<string | null | undefined>): CheckoutItem | null {
  const text = fold(names.filter(Boolean).join(' | '))
  if (!text) return null
  for (const treatise of TREATISES) {
    if (text.includes(fold(treatise.title))) return { kind: 'treatise', treatise }
  }
  const annual = /\b(anual|annual|yearly)\b/.test(text)
  const monthly = /\b(mensal|monthly)\b/.test(text)
  if (annual === monthly) return null
  const plus = /\bplus\b/.test(text)
  const plan: PlanId = annual
    ? plus
      ? 'anual-plus'
      : 'anual-basico'
    : plus
      ? 'mensal-plus'
      : 'mensal-basico'
  return { kind: 'plan', plan }
}

/** Confere o header X-HOTMART-HOTTOK sem vazar tempo de comparação. */
export function hottokMatches(received: string | null): boolean {
  const expected = process.env.HOTMART_HOTTOK?.trim()
  if (!expected || !received) return false
  const a = Buffer.from(received.trim())
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
