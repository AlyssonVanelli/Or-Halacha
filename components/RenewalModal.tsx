'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Check, Star } from 'lucide-react'

interface RenewalModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  isPlus: boolean
  loading?: boolean
}

export function RenewalModal({
  isOpen,
  onClose,
  currentPlan,
  isPlus,
  loading = false,
}: RenewalModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly')

  if (!isOpen) return null

  const plans = [
    {
      id: 'mensal-basico',
      name: 'Mensal Básico',
      price: 'R$ 99,90',
      period: 'mês',
      features: ['Acesso completo ao Shulchan Aruch', 'Busca avançada', 'Favoritos'],
      isPlus: false,
    },
    {
      id: 'mensal-plus',
      name: 'Mensal Plus',
      price: 'R$ 119,90',
      period: 'mês',
      features: ['Tudo do Básico', 'Explicação Prática', 'Suporte prioritário'],
      isPlus: true,
    },
    {
      id: 'anual-basico',
      name: 'Anual Básico',
      price: 'R$ 958,80',
      period: 'ano',
      features: [
        'Acesso completo ao Shulchan Aruch',
        'Busca avançada',
        'Favoritos',
        '17% de economia',
      ],
      isPlus: false,
    },
    {
      id: 'anual-plus',
      name: 'Anual Plus',
      price: 'R$ 1.078,80',
      period: 'ano',
      features: ['Tudo do Básico', 'Explicação Prática', 'Suporte prioritário', '17% de economia'],
      isPlus: true,
    },
  ]

  const handleRenew = async () => {
    if (!selectedPlan) return

    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: selectedPlan,
        }),
      })

      const data = await response.json()

      if (data.success) {
        window.location.href = data.checkoutUrl
      } else {
        console.error('Erro ao renovar:', data.error)
      }
    } catch (error) {
      console.error('Erro ao renovar:', error)
    }
  }

  const getCurrentPlanId = () => {
    if (currentPlan === 'yearly') {
      return isPlus ? 'anual-plus' : 'anual-basico'
    } else {
      return isPlus ? 'mensal-plus' : 'mensal-basico'
    }
  }

  const currentPlanId = getCurrentPlanId()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Renovar Assinatura</h3>
                  <p className="text-sm text-gray-600">
                    Escolha um novo plano para continuar seu acesso
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 transition-colors hover:bg-gray-200"
                disabled={loading}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Period Toggle */}
            <div className="mb-6">
              <div className="flex w-fit rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    selectedPeriod === 'monthly'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    selectedPeriod === 'yearly'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Anual
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {plans
                .filter(plan => {
                  if (selectedPeriod === 'monthly') {
                    return plan.id.includes('mensal')
                  } else {
                    return plan.id.includes('anual')
                  }
                })
                .map(plan => (
                  <div
                    key={plan.id}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      selectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${plan.id === currentPlanId ? 'ring-2 ring-green-500' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.id === currentPlanId && (
                      <div className="absolute -right-2 -top-2 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                        Atual
                      </div>
                    )}

                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-blue-600">{plan.price}</span>
                          <span className="text-gray-500">/{plan.period}</span>
                        </div>
                      </div>
                      {plan.isPlus && (
                        <div className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 text-xs font-semibold text-white">
                          PLUS
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {selectedPlan === plan.id && (
                      <div className="absolute right-2 top-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleRenew}
                disabled={loading || !selectedPlan}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processando...' : 'Continuar Renovação'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
