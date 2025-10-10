'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardFooter } from '@/components/DashboardFooter'
import { useAuth } from '@/contexts/auth-context'
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

interface RefundData {
  type: 'subscription' | 'purchase'
  id: string
  title: string
  amount: string
  date: string
  eligible: boolean
}

export default function RefundPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [refundData, setRefundData] = useState<RefundData | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const type = searchParams.get('type')
  const id = searchParams.get('id')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const loadRefundData = useCallback(async () => {
    try {
      const response = await fetch('/api/refund/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      })

      const data = await response.json()
      setRefundData(data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }, [type, id])

  useEffect(() => {
    if (type && id && user) {
      loadRefundData()
    }
  }, [type, id, user, loadRefundData])

  const handleRefund = async () => {
    if (!refundData) return

    setProcessing(true)
    try {
      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundType: refundData.type,
          subscriptionId: refundData.type === 'subscription' ? refundData.id : undefined,
          paymentIntentId: refundData.type === 'purchase' ? refundData.id : undefined,
        }),
      })

      const result = await response.json()
      setResult(result)

      if (result.success) {
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro ao processar reembolso. Tente novamente.',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (result) {
    return (
      <>
        <DashboardHeader />
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
          <main className="flex flex-1 items-center justify-center py-12">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                {result.success ? (
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="mx-auto h-16 w-16 text-red-500" />
                )}
                <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? 'Reembolso Processado' : 'Erro no Reembolso'}
                </CardTitle>
                <CardDescription>{result.message}</CardDescription>
              </CardHeader>
              <CardContent>
                {result.success && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Você será redirecionado para o dashboard em alguns segundos.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </main>
          <DashboardFooter />
        </div>
      </>
    )
  }

  if (!refundData) {
    return (
      <>
        <DashboardHeader />
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
          <main className="flex flex-1 items-center justify-center py-12">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <XCircle className="mx-auto h-16 w-16 text-red-500" />
                <CardTitle className="text-red-600">Dados não encontrados</CardTitle>
                <CardDescription>
                  Não foi possível carregar os dados para reembolso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push('/dashboard')} className="w-full">
                  Voltar ao Dashboard
                </Button>
              </CardContent>
            </Card>
          </main>
          <DashboardFooter />
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader />
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="flex flex-1 items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-amber-500" />
              <CardTitle className="text-amber-600">Confirmar Reembolso</CardTitle>
              <CardDescription>
                Você está prestes a solicitar o reembolso do seu{' '}
                {refundData.type === 'subscription' ? 'plano' : 'tratado'}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold">{refundData.title}</h3>
                <p className="text-sm text-gray-600">Valor: {refundData.amount}</p>
                <p className="text-sm text-gray-600">Data: {refundData.date}</p>
              </div>

              {!refundData.eligible ? (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    O período de reembolso de 7 dias já expirou para este item.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Este item está elegível para reembolso dentro do prazo de 7 dias.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Button
                  onClick={handleRefund}
                  disabled={!refundData.eligible || processing}
                  className="w-full"
                  variant={refundData.eligible ? 'default' : 'secondary'}
                >
                  {processing ? 'Processando...' : 'Confirmar Reembolso'}
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500">
                <p>
                  Ao confirmar, seu{' '}
                  {refundData.type === 'subscription'
                    ? 'plano será cancelado'
                    : 'tratado será removido'}{' '}
                  e o reembolso será processado.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
        <DashboardFooter />
      </div>
    </>
  )
}
