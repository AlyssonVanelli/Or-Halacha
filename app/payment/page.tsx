'use client'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

type PlanKey = 'monthly_basic' | 'monthly_plus' | 'yearly_basic' | 'yearly_plus'
const planPriceIds: Record<PlanKey, string> = {
  monthly_basic: process.env['NEXT_PUBLIC_STRIPE_PRICE_MENSAL'] || '',
  monthly_plus: process.env['NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS'] || '',
  yearly_basic: process.env['NEXT_PUBLIC_STRIPE_PRICE_ANUAL'] || '',
  yearly_plus: process.env['NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS'] || '',
}

export default function PaymentPage() {
  const params = useSearchParams()
  const plan = params ? (params.get('plan') as PlanKey | null) : null
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    if (!plan || !planPriceIds[plan]) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: planPriceIds[plan],
          successUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data.url) {
        throw new Error('URL de redirecionamento não encontrada na resposta')
      }

      window.location.href = data.url
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-3xl font-bold">Pagamento</h1>
        <p className="text-lg">
          Plano selecionado: <b>{plan || 'nenhum'}</b>
        </p>
        {plan && planPriceIds[plan] ? (
          <button
            onClick={handlePay}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Redirecionando...' : 'Pagar com Stripe'}
          </button>
        ) : (
          <p className="mt-4 text-red-600">Selecione um plano válido para pagar.</p>
        )}
      </div>
    </div>
  )
}
