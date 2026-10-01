import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { claimPendingPurchases } from '@/lib/hotmart-events'
import { treatiseById } from '@/lib/content/divisions'
import { PLANS, isPlanId } from '@/lib/plans'

// Assinatura, tratados avulsos e histórico de pagamentos da conta logada (página de perfil)
const PAYMENT_LABELS: Record<string, string> = {
  PURCHASE_APPROVED: 'Pago',
  PURCHASE_REFUNDED: 'Reembolsado',
  PURCHASE_CHARGEBACK: 'Estornado',
}

function itemLabel(item: string | null) {
  if (!item) return '—'
  if (isPlanId(item)) return PLANS[item].name
  const treatise = treatiseById(item)
  return treatise ? `Tratado ${treatise.title}` : '—'
}

export async function GET() {
  const { user } = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const admin = createAdminClient()
  try {
    await claimPendingPurchases(admin, user)
  } catch (err) {
    console.error('Erro ao vincular compras pendentes:', err)
  }

  const [{ data: subscription }, { data: books }, { data: events }] = await Promise.all([
    admin
      .from('subscriptions')
      .select(
        'status, plan_type, explicacao_pratica, provider, current_period_end, next_charge_at, cancel_at_period_end, created_at'
      )
      .eq('user_id', user.id)
      .maybeSingle(),
    admin
      .from('purchased_books')
      .select('division_id, expires_at, created_at')
      .eq('user_id', user.id)
      .order('expires_at', { ascending: false }),
    admin
      .from('payment_events')
      .select('event, item, amount, currency, created_at')
      .eq('user_id', user.id)
      .in('event', Object.keys(PAYMENT_LABELS))
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return NextResponse.json({
    subscription: subscription || null,
    treatises: (books || []).map(b => ({
      divisionId: b.division_id,
      title: treatiseById(b.division_id as string)?.title || 'Tratado',
      expiresAt: b.expires_at,
      purchasedAt: b.created_at,
    })),
    payments: (events || []).map(e => ({
      date: e.created_at,
      description: itemLabel(e.item as string | null),
      amount: e.amount === null ? null : Number(e.amount),
      currency: e.currency || 'BRL',
      status: PAYMENT_LABELS[e.event as string] || e.event,
    })),
  })
}
