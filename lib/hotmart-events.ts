import type { createAdminClient } from '@/lib/supabase/admin'
import { PLANS, isPlanId } from '@/lib/plans'
import { itemFromNames, itemFromOfferCode, itemKey, type CheckoutItem } from '@/lib/hotmart'

// Processamento das notificações (webhook 2.0) da Hotmart — SOMENTE servidor.
// Formato dos eventos: https://developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/

type Admin = ReturnType<typeof createAdminClient>
type Json = Record<string, unknown>

/** Tolerância após a data de cobrança, para a renovação (cartão/Pix) chegar sem cortar o acesso. */
const RENEWAL_GRACE_DAYS = 3

const obj = (v: unknown): Json =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {}
const str = (v: unknown): string | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return typeof v === 'string' && v.trim() ? v.trim() : null
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function toDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null
  const d =
    typeof v === 'number' || /^\d+$/.test(String(v)) ? new Date(Number(v)) : new Date(String(v))
  return Number.isNaN(d.getTime()) || d.getFullYear() < 2000 ? null : d
}

const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000)
function addMonths(d: Date, months: number) {
  const r = new Date(d)
  r.setMonth(r.getMonth() + months)
  return r
}
const later = (a: Date | null, b: Date) => (a && a > b ? a : b)

export interface HotmartEvent {
  id: string
  event: string
  transaction: string | null
  subscriberCode: string | null
  buyerEmail: string | null
  userIdHint: string | null
  offerCode: string | null
  offerMetadataPlan: string | null
  names: string[]
  approvedAt: Date | null
  nextChargeAt: Date | null
  amount: number | null
  currency: string | null
}

/** Lê os campos usados pelo site, aceitando as variações de formato entre os eventos. */
export function parseHotmartEvent(body: unknown): HotmartEvent | null {
  const root = obj(body)
  const id = str(root['id'])
  const event = str(root['event'])
  if (!id || !event) return null

  const data = obj(root['data'])
  const purchase = obj(data['purchase'])
  const subscription = obj(data['subscription'])
  const subscriber = obj(data['subscriber'])
  const buyer = obj(data['buyer'])
  const origin = obj(purchase['origin'])
  const offer = obj(purchase['offer'])
  const price = obj(purchase['price'])
  // SWITCH_PLAN traz a lista de planos, com o atual marcado
  const plans = Array.isArray(data['plans']) ? (data['plans'] as unknown[]).map(obj) : []
  const currentPlan = plans.find(p => p['current'] === true) || {}
  const plan = obj(subscription['plan'])
  const topPlan = obj(data['plan'])

  const email =
    str(buyer['email']) || str(subscriber['email']) || str(obj(subscription['user'])['email'])

  return {
    id,
    event: event.toUpperCase(),
    transaction: str(purchase['transaction']),
    subscriberCode:
      str(obj(subscription['subscriber'])['code']) ||
      str(subscription['subscriber_code']) ||
      str(subscriber['code']),
    buyerEmail: email ? email.toLowerCase() : null,
    userIdHint: [origin['xcod'], origin['sck']].map(str).find(v => !!v && UUID.test(v)) || null,
    offerCode:
      str(offer['code']) ||
      str(obj(currentPlan['offer'])['key']) ||
      str(obj(topPlan['offer'])['code']),
    offerMetadataPlan: str(obj(offer['metadata'])['plano']),
    names: [
      offer['name'],
      plan['name'],
      currentPlan['name'],
      topPlan['name'],
      obj(data['product'])['name'],
    ]
      .map(str)
      .filter((v): v is string => !!v),
    approvedAt: toDate(purchase['approved_date']),
    nextChargeAt:
      toDate(purchase['date_next_charge']) ||
      toDate(subscription['date_next_charge']) ||
      toDate(data['date_next_charge']),
    amount: typeof price['value'] === 'number' ? (price['value'] as number) : null,
    currency: str(price['currency_value']),
  }
}

/** Remove do payload o que o site não precisa guardar (documento, endereço, telefone, Pix). */
export function sanitizePayload(body: unknown): Json {
  const copy = JSON.parse(JSON.stringify(body ?? {})) as Json
  const data = obj(copy['data'])
  const buyer = obj(data['buyer'])
  for (const k of [
    'document',
    'document_type',
    'address',
    'checkout_phone',
    'checkout_phone_code',
  ]) {
    delete buyer[k]
  }
  delete obj(data['subscriber'])['phone']
  delete obj(data['producer'])['document']
  const payment = obj(obj(data['purchase'])['payment'])
  for (const k of ['pix_code', 'pix_qrcode', 'billet_barcode', 'billet_url']) delete payment[k]
  return copy
}

export type ProcessStatus = 'processed' | 'ignored' | 'pending_user' | 'error'

export interface ProcessResult {
  status: ProcessStatus
  userId?: string | null
  item?: string | null
  error?: string
}

function resolveItem(ev: HotmartEvent): CheckoutItem | null {
  return (
    itemFromOfferCode(ev.offerCode) ||
    (isPlanId(ev.offerMetadataPlan) ? { kind: 'plan', plan: ev.offerMetadataPlan } : null) ||
    itemFromNames(ev.names)
  )
}

interface SubscriptionRow {
  id: string
  user_id: string
  status: string
  subscription_id: string | null
  current_period_end: string | null
  next_charge_at: string | null
  cancel_at_period_end: boolean | null
  last_transaction_id: string | null
}

const SUB_COLUMNS =
  'id, user_id, status, subscription_id, current_period_end, next_charge_at, cancel_at_period_end, last_transaction_id'

async function findSubscription(admin: Admin, ev: HotmartEvent): Promise<SubscriptionRow | null> {
  if (ev.subscriberCode) {
    const { data, error } = await admin
      .from('subscriptions')
      .select(SUB_COLUMNS)
      .eq('subscription_id', ev.subscriberCode)
      .maybeSingle()
    if (error) throw new Error(`subscriptions: ${error.message}`)
    if (data) return data as SubscriptionRow
  }
  if (ev.transaction) {
    const { data, error } = await admin
      .from('subscriptions')
      .select(SUB_COLUMNS)
      .eq('last_transaction_id', ev.transaction)
      .maybeSingle()
    if (error) throw new Error(`subscriptions: ${error.message}`)
    if (data) return data as SubscriptionRow
  }
  return null
}

/** Conta dona da compra: id enviado no link (xcod/sck) ou, sem ele, o e-mail do comprador. */
async function resolveUserId(admin: Admin, ev: HotmartEvent): Promise<string | null> {
  if (ev.userIdHint) {
    const { data } = await admin.auth.admin.getUserById(ev.userIdHint)
    if (data?.user) return data.user.id
  }
  if (ev.buyerEmail) {
    const { data, error } = await admin.rpc('find_user_id_by_email', { p_email: ev.buyerEmail })
    if (error) throw new Error(`find_user_id_by_email: ${error.message}`)
    if (data) return data as string
  }
  return null
}

/** Há uma compra deste assinante/transação esperando a pessoa criar a conta? */
async function hasPendingPurchase(admin: Admin, ev: HotmartEvent) {
  const filters = [
    ev.subscriberCode ? `subscriber_code.eq.${ev.subscriberCode}` : null,
    ev.transaction ? `transaction_id.eq.${ev.transaction}` : null,
  ].filter(Boolean)
  if (filters.length === 0) return false
  const { count } = await admin
    .from('payment_events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending_user')
    .neq('id', ev.id)
    .or(filters.join(','))
  return (count || 0) > 0
}

async function notFound(admin: Admin, ev: HotmartEvent): Promise<ProcessResult> {
  // Evento sobre uma compra ainda sem conta: reaplicado na ordem quando a conta for vinculada
  if (await hasPendingPurchase(admin, ev)) return { status: 'pending_user' }
  return { status: 'ignored' }
}

async function grant(
  admin: Admin,
  ev: HotmartEvent,
  forcedUserId?: string
): Promise<ProcessResult> {
  const item = resolveItem(ev)
  if (!item) {
    return {
      status: 'error',
      error: `Oferta não reconhecida (off=${ev.offerCode ?? '?'}; nomes: ${ev.names.join(' / ') || '?'})`,
    }
  }
  const key = itemKey(item)
  const now = new Date()

  if (item.kind === 'plan') {
    const plan = PLANS[item.plan]
    // Renovação: a assinatura já é conhecida pelo código do assinante
    const existing = await findSubscription(admin, ev)
    const userId = existing?.user_id || forcedUserId || (await resolveUserId(admin, ev))
    if (!userId) return { status: 'pending_user', item: key }

    const active = existing?.status === 'active'
    // PURCHASE_COMPLETE só confirma o fim da garantia de uma compra já liberada
    if (ev.event === 'PURCHASE_COMPLETE' && active) return { status: 'ignored', userId, item: key }
    if (existing && ev.transaction && existing.last_transaction_id === ev.transaction && active) {
      return { status: 'ignored', userId, item: key }
    }

    const start = ev.approvedAt || now
    const fallbackNext = plan.interval === 'year' ? addMonths(start, 12) : addMonths(start, 1)
    // Nunca volta datas para trás (eventos reenviados fora de ordem)
    const prevNext = active && existing?.next_charge_at ? new Date(existing.next_charge_at) : null
    const nextCharge = later(prevNext, ev.nextChargeAt || fallbackNext)

    const row = {
      user_id: userId,
      provider: 'hotmart',
      status: 'active',
      plan_type: plan.interval === 'year' ? 'yearly' : 'monthly',
      explicacao_pratica: plan.plus,
      price_id: ev.offerCode,
      subscription_id:
        ev.subscriberCode || existing?.subscription_id || `hotmart:${ev.transaction || ev.id}`,
      last_transaction_id: ev.transaction,
      current_period_start: start.toISOString(),
      next_charge_at: nextCharge.toISOString(),
      current_period_end: addDays(nextCharge, RENEWAL_GRACE_DAYS).toISOString(),
      cancel_at_period_end: false,
      updated_at: now.toISOString(),
    }

    const { error } = existing
      ? await admin.from('subscriptions').update(row).eq('id', existing.id)
      : await admin.from('subscriptions').upsert(row, { onConflict: 'user_id' })
    if (error) throw new Error(`subscriptions: ${error.message}`)
    return { status: 'processed', userId, item: key }
  }

  // Tratado avulso: 1 mês a partir de agora (ou do fim do acesso atual, se ainda válido)
  const userId = forcedUserId || (await resolveUserId(admin, ev))
  if (!userId) return { status: 'pending_user', item: key }

  const { data: current, error: currentError } = await admin
    .from('purchased_books')
    .select('id, expires_at, transaction_id')
    .eq('user_id', userId)
    .eq('division_id', item.treatise.id)
    .maybeSingle()
  if (currentError) throw new Error(`purchased_books: ${currentError.message}`)
  if (current && ev.transaction && current.transaction_id === ev.transaction) {
    return { status: 'ignored', userId, item: key }
  }

  const currentEnd = current?.expires_at ? new Date(current.expires_at) : null
  const expiresAt = addMonths(later(currentEnd, now), 1)

  // purchased_books.user_id referencia profiles; garante a linha do perfil
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
  if (profileError) throw new Error(`profiles: ${profileError.message}`)

  const { data: division } = await admin
    .from('divisions')
    .select('book_id')
    .eq('id', item.treatise.id)
    .maybeSingle()

  const { error } = await admin.from('purchased_books').upsert(
    {
      user_id: userId,
      division_id: item.treatise.id,
      book_id: division?.book_id ?? null,
      expires_at: expiresAt.toISOString(),
      provider: 'hotmart',
      transaction_id: ev.transaction,
      created_at: now.toISOString(),
    },
    { onConflict: 'user_id,division_id' }
  )
  if (error) throw new Error(`purchased_books: ${error.message}`)
  return { status: 'processed', userId, item: key }
}

/** Reembolso, chargeback ou compra cancelada: tira o acesso dado por aquela transação. */
async function revoke(admin: Admin, ev: HotmartEvent): Promise<ProcessResult> {
  const now = new Date().toISOString()
  const sub = await findSubscription(admin, ev)
  if (sub) {
    // Cobrança de renovação que falhou e foi cancelada: o acesso já termina sozinho no fim do período
    if (ev.event === 'PURCHASE_CANCELED' && sub.last_transaction_id !== ev.transaction) {
      return { status: 'ignored', userId: sub.user_id }
    }
    const { error } = await admin
      .from('subscriptions')
      .update({
        status: 'canceled',
        current_period_end: now,
        next_charge_at: null,
        cancel_at_period_end: false,
        updated_at: now,
      })
      .eq('id', sub.id)
    if (error) throw new Error(`subscriptions: ${error.message}`)
    return { status: 'processed', userId: sub.user_id }
  }

  if (ev.transaction) {
    const { data: rows, error } = await admin
      .from('purchased_books')
      .update({ expires_at: now })
      .eq('transaction_id', ev.transaction)
      .select('user_id')
    if (error) throw new Error(`purchased_books: ${error.message}`)
    if (rows && rows.length > 0) return { status: 'processed', userId: rows[0].user_id as string }
  }
  return notFound(admin, ev)
}

/** Assinante cancelou a renovação: mantém o acesso até a data já paga. */
async function cancelRenewal(admin: Admin, ev: HotmartEvent): Promise<ProcessResult> {
  const sub = await findSubscription(admin, ev)
  if (!sub) return notFound(admin, ev)
  const paidUntil =
    (sub.next_charge_at && new Date(sub.next_charge_at)) ||
    ev.nextChargeAt ||
    (sub.current_period_end && new Date(sub.current_period_end)) ||
    new Date()
  const { error } = await admin
    .from('subscriptions')
    .update({
      cancel_at_period_end: true,
      current_period_end: paidUntil.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)
  if (error) throw new Error(`subscriptions: ${error.message}`)
  return { status: 'processed', userId: sub.user_id }
}

/** Troca de plano feita na área do comprador da Hotmart. */
async function switchPlan(admin: Admin, ev: HotmartEvent): Promise<ProcessResult> {
  const sub = await findSubscription(admin, ev)
  if (!sub) return notFound(admin, ev)
  const item = resolveItem(ev)
  if (!item || item.kind !== 'plan') {
    return {
      status: 'error',
      userId: sub.user_id,
      error: `Plano não reconhecido (off=${ev.offerCode ?? '?'})`,
    }
  }
  const plan = PLANS[item.plan]
  const update: Record<string, unknown> = {
    plan_type: plan.interval === 'year' ? 'yearly' : 'monthly',
    explicacao_pratica: plan.plus,
    price_id: ev.offerCode,
    updated_at: new Date().toISOString(),
  }
  if (ev.nextChargeAt && !sub.cancel_at_period_end) {
    update['next_charge_at'] = ev.nextChargeAt.toISOString()
    const end = addDays(ev.nextChargeAt, RENEWAL_GRACE_DAYS)
    const currentEnd = sub.current_period_end ? new Date(sub.current_period_end) : null
    update['current_period_end'] = later(currentEnd, end).toISOString()
  }
  const { error } = await admin.from('subscriptions').update(update).eq('id', sub.id)
  if (error) throw new Error(`subscriptions: ${error.message}`)
  return { status: 'processed', userId: sub.user_id, item: item.plan }
}

/** Assinante mudou o dia de cobrança. */
async function changeChargeDate(admin: Admin, ev: HotmartEvent): Promise<ProcessResult> {
  const sub = await findSubscription(admin, ev)
  if (!sub) return notFound(admin, ev)
  if (!ev.nextChargeAt || sub.status !== 'active') return { status: 'ignored', userId: sub.user_id }
  const { error } = await admin
    .from('subscriptions')
    .update({
      next_charge_at: ev.nextChargeAt.toISOString(),
      current_period_end: (sub.cancel_at_period_end
        ? ev.nextChargeAt
        : addDays(ev.nextChargeAt, RENEWAL_GRACE_DAYS)
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)
  if (error) throw new Error(`subscriptions: ${error.message}`)
  return { status: 'processed', userId: sub.user_id }
}

/** Renovação atrasada: o acesso segue até o fim do período + tolerância; depois vira "atrasada". */
async function delayed(admin: Admin, ev: HotmartEvent): Promise<ProcessResult> {
  const sub = await findSubscription(admin, ev)
  if (!sub) return notFound(admin, ev)
  const ended = !sub.current_period_end || new Date(sub.current_period_end) <= new Date()
  if (sub.status === 'active' && ended) {
    const { error } = await admin
      .from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('id', sub.id)
    if (error) throw new Error(`subscriptions: ${error.message}`)
    return { status: 'processed', userId: sub.user_id }
  }
  return { status: 'ignored', userId: sub.user_id }
}

/**
 * Aplica um evento. `forcedUserId` é usado ao vincular compras feitas antes do cadastro.
 * Erros de banco são lançados (o webhook responde 500 e a Hotmart reenvia).
 */
export async function processHotmartEvent(
  admin: Admin,
  ev: HotmartEvent,
  forcedUserId?: string
): Promise<ProcessResult> {
  switch (ev.event) {
    case 'PURCHASE_APPROVED':
    case 'PURCHASE_COMPLETE':
      return grant(admin, ev, forcedUserId)
    case 'PURCHASE_REFUNDED':
    case 'PURCHASE_CHARGEBACK':
    case 'PURCHASE_CANCELED':
      return revoke(admin, ev)
    case 'PURCHASE_DELAYED':
      return delayed(admin, ev)
    case 'SUBSCRIPTION_CANCELLATION':
      return cancelRenewal(admin, ev)
    case 'SWITCH_PLAN':
      return switchPlan(admin, ev)
    case 'UPDATE_SUBSCRIPTION_CHARGE_DATE':
      return changeChargeDate(admin, ev)
    default:
      // PURCHASE_PROTEST (pedido de reembolso em análise), boleto/Pix gerado, carrinho abandonado...
      return { status: 'ignored' }
  }
}

/** Grava o resultado do processamento em payment_events. */
export async function saveResult(admin: Admin, eventId: string, result: ProcessResult) {
  const update: Record<string, unknown> = {
    status: result.status,
    error: result.error ?? null,
    processed_at: new Date().toISOString(),
  }
  if (result.userId) update['user_id'] = result.userId
  if (result.item) update['item'] = result.item
  const { error } = await admin.from('payment_events').update(update).eq('id', eventId)
  if (error) console.error('payment_events: erro ao salvar resultado', eventId, error.message)
}

/** Reaplica os eventos de uma lista (em ordem de chegada), opcionalmente para uma conta. */
export async function reprocessEvents(
  admin: Admin,
  rows: Array<{ id: string; payload: unknown }>,
  forcedUserId?: string
) {
  const results: Array<{ id: string } & ProcessResult> = []
  for (const row of rows) {
    const ev = parseHotmartEvent(row.payload)
    if (!ev) continue
    try {
      const result = await processHotmartEvent(admin, ev, forcedUserId)
      await saveResult(admin, row.id, result)
      results.push({ id: row.id, ...result })
    } catch (err) {
      const result: ProcessResult = { status: 'error', error: (err as Error).message }
      await saveResult(admin, row.id, result)
      results.push({ id: row.id, ...result })
    }
  }
  return results
}

/**
 * Compras feitas com este e-mail antes de a pessoa ter conta no site (ou fora do link do site):
 * vincula à conta e libera o acesso. Barato quando não há nada pendente.
 */
export async function claimPendingPurchases(
  admin: Admin,
  user: { id: string; email?: string | null }
) {
  if (!user.email) return 0
  const { data, error } = await admin
    .from('payment_events')
    .select('id, payload')
    .eq('status', 'pending_user')
    .eq('buyer_email', user.email.toLowerCase())
    .order('created_at', { ascending: true })
  if (error || !data || data.length === 0) return 0
  const results = await reprocessEvents(admin, data, user.id)
  return results.filter(r => r.status === 'processed').length
}
