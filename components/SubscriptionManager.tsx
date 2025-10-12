'use client'

import { useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SubscriptionManagerProps {
  showDetails?: boolean
  showActions?: boolean
}

export function SubscriptionManager({
  showDetails = true,
  showActions = true,
}: SubscriptionManagerProps) {
  const { accessInfo, loading, error, refresh } = useSubscription()
  const { user } = useAuth()
  const [actionLoading, setActionLoading] = useState(false)

  const handleCancelSubscription = async () => {
    if (!accessInfo?.subscriptionInfo) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || '' }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Assinatura cancelada com sucesso')
        await refresh()
      } else {
        toast.error(data.error || 'Erro ao cancelar assinatura')
      }
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      toast.error('Erro ao cancelar assinatura')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivateSubscription = async () => {
    if (!accessInfo?.subscriptionInfo) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/subscription/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || '' }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Assinatura reativada com sucesso')
        await refresh()
      } else {
        toast.error(data.error || 'Erro ao reativar assinatura')
      }
    } catch (error) {
      console.error('Erro ao reativar assinatura:', error)
      toast.error('Erro ao reativar assinatura')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Carregando informações da assinatura...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <XCircle className="mr-2 h-5 w-5" />
            <span>Erro ao carregar informações: {error}</span>
          </div>
          <Button variant="outline" onClick={refresh} className="mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!accessInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold">Nenhuma Assinatura Encontrada</h3>
            <p className="mb-4 text-gray-600">Você não possui uma assinatura ativa.</p>
            <Button onClick={() => (window.location.href = '/dashboard')}>Ver Planos</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { subscriptionInfo, purchaseInfo } = accessInfo

  return (
    <div className="space-y-4">
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Status da Assinatura
            </CardTitle>
            <CardDescription>Informações sobre seu acesso atual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Tipo de Acesso:</span>
              <Badge variant={accessInfo.hasAccess ? 'default' : 'secondary'}>
                {accessInfo.accessType === 'subscription'
                  ? 'Assinatura'
                  : accessInfo.accessType === 'purchase'
                    ? 'Compra Avulsa'
                    : 'Nenhum'}
              </Badge>
            </div>

            {subscriptionInfo && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant={subscriptionInfo.isActive ? 'default' : 'destructive'}>
                    {subscriptionInfo.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Plano:</span>
                  <Badge variant={subscriptionInfo.isPlus ? 'default' : 'outline'}>
                    {subscriptionInfo.planType === 'yearly' ? 'Anual' : 'Mensal'}
                    {subscriptionInfo.isPlus ? ' Plus' : ' Básico'}
                  </Badge>
                </div>
              </>
            )}

            {purchaseInfo && purchaseInfo.hasActivePurchases && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Tratados Comprados:</span>
                <Badge variant="outline">{purchaseInfo.purchasedDivisions.length} tratado(s)</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showActions && subscriptionInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Ações da Assinatura</CardTitle>
            <CardDescription>Gerencie sua assinatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionInfo.status === 'active' && (
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  'Cancelar Assinatura'
                )}
              </Button>
            )}

            {subscriptionInfo.status === 'canceled' && (
              <Button
                onClick={handleReactivateSubscription}
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reativando...
                  </>
                ) : (
                  'Reativar Assinatura'
                )}
              </Button>
            )}

            <Button variant="outline" onClick={refresh} disabled={actionLoading} className="w-full">
              Atualizar Informações
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
