'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowUp, Check, X, AlertTriangle, CreditCard } from 'lucide-react'
import {
  getUpgradeOptions,
  calculatePricing,
  executeUpgrade,
  executeRenewal,
  checkDuplicateSubscriptions,
  cleanupDuplicateSubscriptions,
  type SubscriptionPlan,
  type UpgradeOptions,
  type PricingCalculation,
} from '@/lib/subscription-manager'

interface SubscriptionUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: SubscriptionPlan | null
  customerId: string
  currentSubscriptionId: string | null
  onSuccess: (newSubscriptionId: string) => void
}

export default function SubscriptionUpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  customerId,
  currentSubscriptionId,
  onSuccess,
}: SubscriptionUpgradeModalProps) {
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOptions | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [pricing, setPricing] = useState<PricingCalculation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasDuplicates, setHasDuplicates] = useState(false)

  // Carregar opções de upgrade
  useEffect(() => {
    if (isOpen) {
      const options = getUpgradeOptions(currentPlan)
      setUpgradeOptions(options)
      setSelectedPlan(null)
      setPricing(null)
      setError(null)

      // Verificar duplicatas
      checkForDuplicates()
    }
  }, [isOpen, currentPlan, checkForDuplicates])

  // Calcular preços quando selecionar plano
  useEffect(() => {
    if (selectedPlan && currentSubscriptionId) {
      calculatePricingForPlan(selectedPlan)
    }
  }, [selectedPlan, currentSubscriptionId])

  const checkForDuplicates = useCallback(async () => {
    try {
      const { hasDuplicates: duplicates } = await checkDuplicateSubscriptions(customerId)
      setHasDuplicates(duplicates)
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error)
    }
  }, [customerId])

  const calculatePricingForPlan = async (plan: SubscriptionPlan) => {
    try {
      setLoading(true)
      // Simular busca da assinatura atual (em produção, viria do banco)
      const pricing = await calculatePricing(null, plan) // TODO: passar subscription real
      setPricing(pricing)
    } catch (error) {
      setError('Erro ao calcular preços')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    if (!selectedPlan) return

    try {
      setLoading(true)
      setError(null)

      // Limpar duplicatas se existirem
      if (hasDuplicates) {
        await cleanupDuplicateSubscriptions(customerId, currentSubscriptionId || '')
      }

      // Executar upgrade/renewal
      const result = currentSubscriptionId
        ? await executeUpgrade(customerId, currentSubscriptionId, selectedPlan)
        : await executeRenewal(customerId, selectedPlan)

      if (result.success && result.subscriptionId) {
        onSuccess(result.subscriptionId)
        onClose()
      } else {
        setError(result.error || 'Erro no upgrade')
      }
    } catch (error) {
      setError('Erro inesperado no upgrade')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const getPlanIcon = (plan: SubscriptionPlan) => {
    if (plan.interval === 'year') return '📅'
    return '📆'
  }

  const getPlanBadge = (plan: SubscriptionPlan) => {
    if (plan.isPlus) return <Badge className="bg-purple-100 text-purple-800">Plus</Badge>
    return <Badge variant="outline">Básico</Badge>
  }

  if (!upgradeOptions) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5 text-blue-600" />
            {upgradeOptions.isUpgrade ? 'Fazer Upgrade' : 'Renovar Assinatura'}
          </DialogTitle>
          <DialogDescription>
            {upgradeOptions.isUpgrade
              ? 'Escolha um plano superior para ter acesso a mais recursos.'
              : 'Escolha um plano para renovar sua assinatura.'}
          </DialogDescription>
        </DialogHeader>

        {/* Aviso sobre duplicatas */}
        {hasDuplicates && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Assinaturas Duplicadas Detectadas</span>
            </div>
            <p className="mt-1 text-sm text-yellow-700">
              Encontramos múltiplas assinaturas ativas. As antigas serão canceladas automaticamente.
            </p>
          </div>
        )}

        {/* Plano Atual */}
        {upgradeOptions.currentPlan && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-gray-700">Plano Atual</h3>
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getPlanIcon(upgradeOptions.currentPlan)}</span>
                    <div>
                      <h4 className="font-semibold">{upgradeOptions.currentPlan.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatPrice(upgradeOptions.currentPlan.price)}/
                        {upgradeOptions.currentPlan.interval === 'month' ? 'mês' : 'ano'}
                      </p>
                    </div>
                  </div>
                  {getPlanBadge(upgradeOptions.currentPlan)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Opções de Upgrade */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">
            {upgradeOptions.isUpgrade ? 'Planos Disponíveis' : 'Escolha um Plano'}
          </h3>

          <div className="grid gap-4">
            {upgradeOptions.availableUpgrades.map(plan => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlan?.id === plan.id
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getPlanIcon(plan)}</span>
                      <div>
                        <h4 className="flex items-center gap-2 font-semibold">
                          {plan.name}
                          {getPlanBadge(plan)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatPrice(plan.price)}/{plan.interval === 'month' ? 'mês' : 'ano'}
                        </p>
                        {plan.interval === 'year' && (
                          <p className="text-xs text-green-600">
                            Economia de{' '}
                            {formatPrice(plan.price / 12 - (plan.isPlus ? 149.9 : 99.9))}/mês
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedPlan?.id === plan.id ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cálculo de Preços */}
        {pricing && (
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <h4 className="mb-3 font-medium">Resumo do Upgrade</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Plano Atual:</span>
                <span>{pricing.currentPlan?.name || 'Nenhum'}</span>
              </div>
              <div className="flex justify-between">
                <span>Novo Plano:</span>
                <span>{pricing.newPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Cobrança Imediata:</span>
                <span className="font-medium">{formatPrice(pricing.immediateCharge)}</span>
              </div>
              {pricing.savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Economia Anual:</span>
                  <span className="font-medium">{formatPrice(pricing.savings)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Próxima Cobrança:</span>
                <span>{new Date(pricing.nextBillingDate).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-800">
              <X className="h-4 w-4" />
              <span className="font-medium">Erro</span>
            </div>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={!selectedPlan || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {upgradeOptions.isUpgrade ? 'Fazer Upgrade' : 'Renovar'}
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
