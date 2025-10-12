'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react'

export default function TestStripePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testProducts = [
    {
      id: 'test-monthly',
      name: 'Teste Mensal',
      description: 'Assinatura mensal de teste',
      price: 'R$ 29,90',
      priceId: 'price_1RQCoOFLuMsSi0YiBmCrrM1r', // Seu price ID real
      type: 'subscription',
    },
    {
      id: 'test-yearly',
      name: 'Teste Anual',
      description: 'Assinatura anual de teste',
      price: 'R$ 299,90',
      priceId: 'price_1RQCoOFLuMsSi0YiBmCrrM1r', // Seu price ID real
      type: 'subscription',
    },
    {
      id: 'test-book',
      name: 'Livro Teste',
      description: 'Compra avulsa de livro teste',
      price: 'R$ 19,90',
      priceId: 'price_1RQCoOFLuMsSi0YiBmCrrM1r', // Seu price ID real
      type: 'payment',
    },
  ]

  const handleTestCheckout = async (product: any) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('=== INICIANDO TESTE DE CHECKOUT ===')
      console.log('Produto:', product)

      const response = await fetch('/api/test-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: product.priceId,
          mode: product.type,
          userId: '3f0e0184-c0a7-487e-b611-72890b39dcce', // Seu user ID
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`)
      }

      if (data.url) {
        console.log('Redirecionando para:', data.url)
        console.log('Session ID:', data.sessionId)

        // Testar webhook real com a session criada
        if (data.sessionId) {
          console.log('Testando webhook real com session:', data.sessionId)
          await handleTestRealWebhook(data.sessionId)
        }

        // Redirecionar para Stripe
        window.location.href = data.url
      } else {
        setResult(data)
      }
    } catch (err: any) {
      console.error('Erro no checkout:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleTestWebhook = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('=== TESTANDO WEBHOOK ===')

      const response = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: '3f0e0184-c0a7-487e-b611-72890b39dcce',
          testMode: true,
        }),
      })

      const data = await response.json()
      console.log('Webhook test result:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro no webhook')
      }

      setResult(data)
    } catch (err: any) {
      console.error('Erro no webhook:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleTestRealWebhook = async (sessionId: string) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('=== TESTANDO WEBHOOK REAL ===')
      console.log('Session ID:', sessionId)

      const response = await fetch('/api/test-real-stripe-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
        }),
      })

      const data = await response.json()
      console.log('Real webhook test result:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro no webhook real')
      }

      setResult(data)
    } catch (err: any) {
      console.error('Erro no webhook real:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleTestDatabase = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('=== TESTANDO BANCO DE DADOS ===')

      const response = await fetch('/api/subscription/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: '3f0e0184-c0a7-487e-b611-72890b39dcce',
        }),
      })

      const data = await response.json()
      console.log('Database test result:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro no banco')
      }

      setResult(data)
    } catch (err: any) {
      console.error('Erro no banco:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubscription = async (planType: string, isPlus: boolean) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('=== CRIANDO ASSINATURA DIRETAMENTE ===')
      console.log('Plan Type:', planType)
      console.log('Is Plus:', isPlus)

      const response = await fetch('/api/test-create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: '3f0e0184-c0a7-487e-b611-72890b39dcce',
          planType: planType,
          isPlus: isPlus,
        }),
      })

      const data = await response.json()
      console.log('Create subscription result:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar assinatura')
      }

      setResult(data)
    } catch (err: any) {
      console.error('Erro ao criar assinatura:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleActivateSubscription = async (subscriptionId: string) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('=== ATIVANDO ASSINATURA ===')
      console.log('Subscription ID:', subscriptionId)

      const response = await fetch('/api/test-activate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionId,
        }),
      })

      const data = await response.json()
      console.log('Activate subscription result:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao ativar assinatura')
      }

      setResult(data)
    } catch (err: any) {
      console.error('Erro ao ativar assinatura:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">🧪 Teste de Integração Stripe</h1>
          <p className="text-gray-600">Teste completo da integração Stripe → Banco de Dados</p>
        </div>

        {/* Status */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="text-center">
                  <Badge variant="outline" className="mb-2">
                    Stripe
                  </Badge>
                  <p className="text-sm text-gray-600">Configuração</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="mb-2">
                    Webhook
                  </Badge>
                  <p className="text-sm text-gray-600">Eventos</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="mb-2">
                    Banco
                  </Badge>
                  <p className="text-sm text-gray-600">Sincronização</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Produtos de Teste */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Produtos de Teste</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testProducts.map(product => (
              <Card key={product.id} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {product.name}
                    <Badge variant={product.type === 'subscription' ? 'default' : 'secondary'}>
                      {product.type === 'subscription' ? 'Assinatura' : 'Compra'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-green-600">{product.price}</span>
                  </div>
                  <Button
                    onClick={() => handleTestCheckout(product)}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Testar Checkout
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Criar Assinatura Diretamente */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Criar Assinatura Diretamente</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Button
              onClick={() => handleCreateSubscription('monthly', false)}
              disabled={loading}
              className="flex h-20 flex-col bg-blue-600 hover:bg-blue-700"
            >
              <span className="font-semibold">Mensal Normal</span>
              <span className="text-xs text-blue-100">Criar assinatura mensal</span>
            </Button>

            <Button
              onClick={() => handleCreateSubscription('yearly', false)}
              disabled={loading}
              className="flex h-20 flex-col bg-green-600 hover:bg-green-700"
            >
              <span className="font-semibold">Anual Normal</span>
              <span className="text-xs text-green-100">Criar assinatura anual</span>
            </Button>

            <Button
              onClick={() => handleCreateSubscription('monthly', true)}
              disabled={loading}
              className="flex h-20 flex-col bg-purple-600 hover:bg-purple-700"
            >
              <span className="font-semibold">Mensal Plus</span>
              <span className="text-xs text-purple-100">Criar assinatura Plus</span>
            </Button>

            <Button
              onClick={() => handleCreateSubscription('yearly', true)}
              disabled={loading}
              className="flex h-20 flex-col bg-orange-600 hover:bg-orange-700"
            >
              <span className="font-semibold">Anual Plus</span>
              <span className="text-xs text-orange-100">Criar assinatura Plus</span>
            </Button>
          </div>
        </div>

        {/* Testes de Sistema */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Testes de Sistema</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button
              onClick={handleTestWebhook}
              disabled={loading}
              variant="outline"
              className="flex h-20 flex-col"
            >
              <span className="font-semibold">Testar Webhook</span>
              <span className="text-xs text-gray-500">Simular evento Stripe</span>
            </Button>

            <Button
              onClick={handleTestDatabase}
              disabled={loading}
              variant="outline"
              className="flex h-20 flex-col"
            >
              <span className="font-semibold">Testar Banco</span>
              <span className="text-xs text-gray-500">Verificar dados</span>
            </Button>

            <Button
              onClick={() => window.location.reload()}
              disabled={loading}
              variant="outline"
              className="flex h-20 flex-col"
            >
              <span className="font-semibold">Limpar</span>
              <span className="text-xs text-gray-500">Resetar página</span>
            </Button>
          </div>
        </div>

        {/* Resultados */}
        {(result || error) && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Resultado do Teste</h2>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-5 w-5" />
                    Erro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm text-red-600">{error}</pre>
                </CardContent>
              </Card>
            )}

            {result && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Sucesso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm text-green-600">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Logs do Console */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Console</CardTitle>
              <CardDescription>Abra o DevTools (F12) para ver os logs detalhados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-green-400">
                <div>=== LOGS DO CONSOLE ===</div>
                <div>1. Abra o DevTools (F12)</div>
                <div>2. Vá para a aba Console</div>
                <div>3. Execute os testes acima</div>
                <div>4. Veja os logs detalhados</div>
                <div>5. Identifique onde está o erro</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
