'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HOTMART_BUYER_AREA_URL, REFUND_DAYS, planFromSubscription } from '@/lib/plans'

// Assinatura, tratados avulsos e histórico de pagamentos no perfil. Cancelar, trocar de plano
// ou de cartão e pedir reembolso são feitos na área do comprador da Hotmart, que avisa o site.

interface Billing {
  subscription: {
    status: string
    plan_type: string
    explicacao_pratica: boolean
    current_period_end: string | null
    next_charge_at: string | null
    cancel_at_period_end: boolean | null
  } | null
  treatises: Array<{ divisionId: string; title: string; expiresAt: string; purchasedAt: string }>
  payments: Array<{
    date: string
    description: string
    amount: number | null
    currency: string
    status: string
  }>
}

const card = 'rounded-xl border-0 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-xl'
const cardTitle =
  'mb-6 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-2xl font-bold text-transparent'

const day = (iso: string | null | undefined) => (iso ? format(new Date(iso), 'dd/MM/yyyy') : '—')

function money(amount: number | null, currency: string) {
  if (amount === null) return '—'
  try {
    return amount.toLocaleString('pt-BR', { style: 'currency', currency })
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function BuyerArea({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-gray-700">
      {children ?? (
        <>
          <p className="mb-2 font-semibold text-gray-900">Gerenciar na Hotmart</p>
          <p className="mb-2">
            Sua assinatura é cobrada pela Hotmart. Na área do comprador, em{' '}
            <b>Minhas compras → Or Halachá</b>, você pode:
          </p>
          <ul className="mb-3 list-disc space-y-1 pl-5">
            <li>trocar de plano (Básico ou Plus, mensal ou anual);</li>
            <li>trocar o cartão ou a forma de pagamento;</li>
            <li>cancelar a renovação (o acesso continua até o fim do período pago);</li>
            <li>pedir reembolso integral em até {REFUND_DAYS} dias após a compra.</li>
          </ul>
        </>
      )}
      <a
        href={HOTMART_BUYER_AREA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
      >
        Abrir área do comprador <ExternalLink className="h-4 w-4" aria-hidden />
      </a>
      <p className="mt-2 text-xs text-gray-500">Entre com o e-mail usado na compra.</p>
    </div>
  )
}

function SubscriptionCard({ sub }: { sub: Billing['subscription'] }) {
  const now = new Date()
  const active =
    !!sub &&
    sub.status === 'active' &&
    (!sub.current_period_end || new Date(sub.current_period_end) > now)

  if (!sub || (!active && sub.status !== 'past_due')) {
    return (
      <div className={card}>
        <h2 className={cardTitle}>Minha assinatura</h2>
        <p className="mb-4 text-gray-700">
          {sub ? 'Sua assinatura foi encerrada.' : 'Você ainda não tem assinatura.'} O siman do dia
          continua grátis.
        </p>
        <Button asChild className="w-full">
          <Link href="/planos">Ver planos</Link>
        </Button>
      </div>
    )
  }

  const plan = planFromSubscription(sub)
  return (
    <div className={card}>
      <h2 className={cardTitle}>Minha assinatura</h2>
      <div className="space-y-1 text-gray-800">
        <p className="flex flex-wrap items-center gap-2">
          Plano: <b>{plan.name}</b>
          {plan.plus && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              ✨ Plus
            </span>
          )}
        </p>
        {sub.status === 'past_due' ? (
          <p className="mt-2 rounded bg-yellow-100 p-3 text-sm font-medium text-yellow-900">
            O pagamento da renovação está pendente e o acesso foi pausado. Atualize o cartão ou
            pague na área do comprador da Hotmart para voltar a ler.
          </p>
        ) : sub.cancel_at_period_end ? (
          <p className="mt-2 rounded bg-yellow-100 p-3 text-sm font-medium text-yellow-900">
            Renovação cancelada. Você tem acesso até <b>{day(sub.current_period_end)}</b>. Depois
            dessa data, é só assinar de novo se quiser.
          </p>
        ) : (
          <p>
            Próxima cobrança: <b>{day(sub.next_charge_at || sub.current_period_end)}</b>
          </p>
        )}
      </div>
      <BuyerArea />
    </div>
  )
}

export function BillingSection() {
  const [billing, setBilling] = useState<Billing | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch('/api/account/billing')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then(setBilling)
      .catch(() => setFailed(true))
  }, [])

  if (failed) {
    return (
      <div className={card}>
        <p className="text-gray-700">
          Não foi possível carregar sua assinatura agora. Recarregue a página em instantes.
        </p>
      </div>
    )
  }

  if (!billing) {
    return (
      <div className={`${card} flex justify-center`} role="status">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="sr-only">Carregando assinatura…</span>
      </div>
    )
  }

  const now = new Date()
  const treatises = billing.treatises.filter(t => new Date(t.expiresAt) > now)

  return (
    <div className="space-y-8">
      <SubscriptionCard sub={billing.subscription} />

      {treatises.length > 0 && (
        <div className={card}>
          <h2 className={cardTitle}>Meus tratados avulsos</h2>
          <ul className="space-y-3">
            {treatises.map(t => (
              <li key={t.divisionId} className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  <b>{t.title}</b>
                  <span className="block text-sm text-gray-600">Acesso até {day(t.expiresAt)}</span>
                </span>
                <Button asChild size="sm">
                  <Link href={`/tratado/${t.divisionId}`}>Ler</Link>
                </Button>
              </li>
            ))}
          </ul>
          <BuyerArea>
            <p className="mb-3">
              Quer o reembolso? Peça em até {REFUND_DAYS} dias após a compra na área do comprador da
              Hotmart (Minhas compras).
            </p>
          </BuyerArea>
        </div>
      )}

      <div className={card}>
        <h2 className={cardTitle}>Histórico de pagamentos</h2>
        {billing.payments.length === 0 ? (
          <p className="py-4 text-center text-gray-500">Nenhum pagamento ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-gray-700">
                  <th className="p-3 font-semibold">Data</th>
                  <th className="p-3 font-semibold">Descrição</th>
                  <th className="p-3 font-semibold">Valor</th>
                  <th className="p-3 font-semibold">Situação</th>
                </tr>
              </thead>
              <tbody>
                {billing.payments.map((p, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="p-3 text-gray-600">{day(p.date)}</td>
                    <td className="p-3 text-gray-800">{p.description}</td>
                    <td className="whitespace-nowrap p-3 font-semibold text-gray-800">
                      {money(p.amount, p.currency)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          p.status === 'Pago'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
