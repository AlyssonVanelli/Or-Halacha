'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, BookOpen } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { HeaderSimplificado } from '@/components/DashboardHeader'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  priceId: string
  interval: 'month' | 'year'
  explicacao_pratica: boolean
}

const priceIds = {
  basic: process.env['NEXT_PUBLIC_STRIPE_PRICE_BASIC'] || '',
  mensal: process.env['NEXT_PUBLIC_STRIPE_PRICE_MENSAL'] || '',
  mensal_plus: process.env['NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS'] || '',
  anual: process.env['NEXT_PUBLIC_STRIPE_PRICE_ANUAL'] || '',
  anual_plus: process.env['NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS'] || '',
}

const plans: Plan[] = [
  {
    id: 'monthly_basic',
    name: 'Mensal',
    description: 'Acesso à Halachá traduzida',
    price: 99.9,
    features: [
      'Acesso à Halachá traduzida',
      'Pesquisa avançada',
      'Favoritos e marcadores',
      'Cancelamento a qualquer momento',
    ],
    priceId: priceIds.mensal,
    interval: 'month',
    explicacao_pratica: false,
  },
  {
    id: 'monthly_plus',
    name: 'Mensal Plus',
    description: 'Acesso à Halachá traduzida + explicações práticas',
    price: 119.9,
    features: ['Tudo do plano Mensal', 'Explicações práticas da Halachá para o dia a dia'],
    priceId: priceIds.mensal_plus,
    interval: 'month',
    explicacao_pratica: true,
  },
  {
    id: 'yearly_basic',
    name: 'Anual',
    description: 'Acesso à Halachá traduzida',
    price: 79.9,
    features: [
      'Acesso à Halachá traduzida',
      'Pesquisa avançada',
      'Favoritos e marcadores',
      'Cancelamento a qualquer momento',
      'Economia de 20%',
    ],
    priceId: priceIds.anual,
    interval: 'year',
    explicacao_pratica: false,
  },
  {
    id: 'yearly_plus',
    name: 'Anual Plus',
    description: 'Acesso à Halachá traduzida + explicações práticas',
    price: 89.9,
    features: ['Tudo do plano Anual', 'Explicações práticas da Halachá para o dia a dia'],
    priceId: priceIds.anual_plus,
    interval: 'year',
    explicacao_pratica: true,
  },
]

export default function PlanosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const erroAcesso = searchParams && searchParams.get('erro') === 'acesso'

  useEffect(() => {
    async function loadCurrentPlan() {
      if (!user) return
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, plan_type')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (error) {
          return
        }

        if (data?.status === 'active') {
          setCurrentPlan(data.plan_type)
        }
      } catch (error) {
        return
      }
    }
    loadCurrentPlan()
    // Recarrega o status ao voltar para a aba
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        loadCurrentPlan()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [user])

  async function handleSubscribe(planId: string) {
    if (!user) {
      router.push('/login')
      return
    }

    if (currentPlan && !planId.includes('plus') && currentPlan.includes('basic')) {
      return
    }

    setLoading(planId)

    try {
      // Se for upgrade para Plus, redireciona para o Customer Portal
      if (planId.includes('plus') && currentPlan && !currentPlan.includes('plus')) {
        const supabase = createClient()
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single()

        if (profileError) {
          setLoading(null)
          return
        }

        if (!profile?.stripe_customer_id) {
          setLoading(null)
          return
        }

        const response = await fetch('/api/upgrade-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: profile.stripe_customer_id }),
        })
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
          return
        } else {
          setLoading(null)
          return
        }
      }

      // Nova assinatura: chama o endpoint de checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plans.find(p => p.id === planId)?.priceId,
          userId: user.id,
          successUrl: `${window.location.origin}/payment/success?checkout=ok`,
          cancelUrl: `${window.location.origin}/payment/cancel?checkout=fail`,
        }),
      })
      const { url } = await response.json()
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('stripe_payment_attempt', '1')
      }
      window.location.href = url
    } catch (error) {
      return
    } finally {
      setLoading(null)
    }
  }

  // Função para saber se o usuário pode assinar este plano
  function canSubscribe(plan: Plan): boolean {
    if (!user || !currentPlan) return true
    // Se já tem um plano Plus, não pode assinar nenhum outro
    if (currentPlan.includes('plus')) return false
    // Só pode fazer upgrade para o Plus correspondente
    if (!plan.id.includes('plus')) return false
    // Só pode fazer upgrade para o Plus do mesmo ciclo (mensal para mensal_plus, anual para anual_plus)
    if (currentPlan.includes('monthly') && plan.id === 'monthly_plus') return true
    if (currentPlan.includes('yearly') && plan.id === 'yearly_plus') return true
    return false
  }

  // Função para mensagem do botão
  function getButtonLabel(plan: Plan): React.ReactNode {
    if (loading === plan.id)
      return (
        <span className="flex items-center justify-center">
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </span>
      )
    if (currentPlan === plan.id) return 'Plano Atual'
    if (user && currentPlan) {
      if (currentPlan.includes('plus')) return 'Você já possui um plano Plus ativo'
      if (!plan.id.includes('plus')) return 'Apenas upgrade para Plus'
      if (currentPlan.includes('monthly') && plan.id === 'monthly_plus')
        return 'Fazer upgrade para Plus'
      if (currentPlan.includes('yearly') && plan.id === 'yearly_plus')
        return 'Fazer upgrade para Plus'
      return 'Não disponível'
    }
    return 'Assinar Agora'
  }

  return (
    <>
      <HeaderSimplificado />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <div className="container max-w-6xl py-12">
          <div className="mb-12 text-center">
            {/* Logo */}
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-600">Or Halachá</h2>
                <p className="text-sm text-gray-600">Plataforma de Estudo Haláchico</p>
              </div>
            </div>

            <h1 className="mb-4 text-4xl font-bold">Escolha seu Plano</h1>
            <p className="text-lg text-muted-foreground">
              Acesso completo a todos os livros e recursos
            </p>
            {erroAcesso && (
              <div className="mt-4 rounded bg-red-100 p-4 text-red-700">
                Você tentou acessar um conteúdo restrito. Escolha um plano ou compre o livro avulso
                para continuar.
              </div>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {plans.map(plan => (
              <div key={plan.id} className="rounded-lg border bg-card p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="mb-2 text-2xl font-bold">{plan.name}</h2>
                  <p className="mb-4 text-muted-foreground">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">R$ {plan.price}</span>
                    <span className="text-muted-foreground">
                      /{plan.interval === 'month' ? 'mês' : 'mês'}
                    </span>
                  </div>
                  {plan.interval === 'year' && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Cobrança anual de R$ {(plan.price * 12).toFixed(2)}
                    </p>
                  )}
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!canSubscribe(plan) || loading === plan.id || currentPlan === plan.id}
                >
                  {getButtonLabel(plan)}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <h2 className="mb-4 text-2xl font-bold">Ou assine um tratado avulso</h2>
            <p className="mb-6 text-muted-foreground">Acesso a um tratado específico por 1 mês</p>
            <div className="mb-2 text-lg font-bold">R$ 29,90/mês</div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/livros')}
              disabled={loading === 'tratado_avulso'}
            >
              Escolher Tratado Avulso
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
