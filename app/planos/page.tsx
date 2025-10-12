'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ConditionalLayout } from '@/components/ConditionalLayout'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  priceId: string
  interval: 'month' | 'year'
  explicacao_pratica: boolean
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: 'mensal-basico',
    name: 'Mensal Básico',
    description: 'Acesso completo ao Shulchan Aruch',
    price: 99.9,
    features: [
      'Acesso completo ao Shulchan Aruch',
      'Busca avançada',
      'Favoritos e marcadores',
      'Cancelamento a qualquer momento',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL || '',
    interval: 'month',
    explicacao_pratica: false,
  },
  {
    id: 'mensal-plus',
    name: 'Mensal Plus',
    description: 'Tudo do Básico + Explicação Prática',
    price: 119.9,
    features: [
      'Tudo do plano Básico',
      'Explicação Prática da Halachá',
      'Suporte prioritário',
      'Cancelamento a qualquer momento',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS || '',
    interval: 'month',
    explicacao_pratica: true,
    popular: true,
  },
  {
    id: 'anual-basico',
    name: 'Anual Básico',
    description: 'Acesso completo ao Shulchan Aruch',
    price: 958.8,
    features: [
      'Acesso completo ao Shulchan Aruch',
      'Busca avançada',
      'Favoritos e marcadores',
      'Cancelamento a qualquer momento',
      'Economia de 17%',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL || '',
    interval: 'year',
    explicacao_pratica: false,
  },
  {
    id: 'anual-plus',
    name: 'Anual Plus',
    description: 'Tudo do Básico + Explicação Prática',
    price: 1078.8,
    features: [
      'Tudo do plano Anual',
      'Explicação Prática da Halachá',
      'Suporte prioritário',
      'Cancelamento a qualquer momento',
      'Economia de 17%',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS || '',
    interval: 'year',
    explicacao_pratica: true,
  },
]

export default function PlanosPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(planId)
    try {
      const response = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planType: planId,
          userEmail: user.email,
          successUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        }),
      })

      const data = await response.json()

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Erro ao criar checkout')
      }
    } catch (error) {
      toast({
        title: 'Erro na assinatura',
        description: 'Não foi possível iniciar o processo de assinatura. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <ConditionalLayout>
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Escolha seu Plano</h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Acesso completo ao Shulchan Aruch traduzido para o português, com recursos avançados
            para seu estudo da Halachá.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-4">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-white shadow-lg transition-all duration-300 hover:shadow-xl ${
                plan.popular ? 'scale-105 border-blue-500' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white">
                    <Star className="h-4 w-4" />
                    Mais Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="mb-6 text-center">
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mb-4 text-gray-600">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-blue-600">
                      R$ {plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-500">
                      /{plan.interval === 'month' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  {plan.interval === 'year' && (
                    <p className="mt-2 text-sm text-gray-500">
                      Economia de 17% comparado ao mensal
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={`h-12 w-full text-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading === plan.id ? 'Processando...' : 'Assinar Agora'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-20 max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Perguntas Frequentes
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode cancelar sua assinatura a qualquer momento. Você manterá o acesso até
                o fim do período atual.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                O que é a Explicação Prática?
              </h3>
              <p className="text-gray-600">
                A Explicação Prática oferece insights sobre como aplicar a Halachá no dia a dia, com
                exemplos práticos e situações reais.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Como funciona o reembolso?
              </h3>
              <p className="text-gray-600">
                Oferecemos reembolso total até 7 dias após a compra. Após esse período, você pode
                cancelar a renovação.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Posso mudar de plano?</h3>
              <p className="text-gray-600">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento através da
                sua conta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ConditionalLayout>
  )
}
