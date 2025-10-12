'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/ConfirmationModal'

interface SubscriptionActionsProps {
  subscriptionId: string
  isPlus: boolean
  planType: string
  createdAt: string
}

export function SubscriptionActions({
  subscriptionId,
  isPlus,
  planType,
  createdAt,
}: SubscriptionActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'cancel' | 'upgrade' | 'refund' | null>(null)

  const openModal = (type: 'cancel' | 'upgrade' | 'refund') => {
    setModalType(type)
    setModalOpen(true)
  }

  const handleConfirm = async () => {
    if (!modalType) return

    setLoading(modalType)
    try {
      let response: Response
      let data: any

      switch (modalType) {
        case 'cancel':
          response = await fetch('/api/subscription/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          data = await response.json()
          if (data.success) {
            toast.success('Assinatura cancelada com sucesso!')
            window.location.reload()
          } else {
            toast.error(data.error || 'Erro ao cancelar assinatura')
          }
          break

        case 'upgrade':
          response = await fetch('/api/subscription/upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planType: isPlus ? 'anual-plus' : 'mensal-plus',
            }),
          })
          data = await response.json()
          if (data.success) {
            window.location.href = data.checkoutUrl
          } else {
            toast.error(data.error || 'Erro ao fazer upgrade')
          }
          break

        case 'refund':
          const subscriptionDate = new Date(createdAt)
          const now = new Date()
          const daysDifference = Math.floor(
            (now.getTime() - subscriptionDate.getTime()) / (1000 * 60 * 60 * 24)
          )

          if (daysDifference > 7) {
            toast.error(
              'Prazo para reembolso expirado. Reembolsos são permitidos apenas até 7 dias após a compra.'
            )
            setModalOpen(false)
            setLoading(null)
            return
          }

          response = await fetch('/api/subscription/refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          data = await response.json()
          if (data.success) {
            toast.success('Reembolso processado com sucesso!')
            window.location.reload()
          } else {
            toast.error(data.error || 'Erro ao processar reembolso')
          }
          break
      }
    } catch (error) {
      toast.error('Erro ao processar solicitação')
    } finally {
      setLoading(null)
      setModalOpen(false)
      setModalType(null)
    }
  }

  const subscriptionDate = new Date(createdAt)
  const now = new Date()
  const daysDifference = Math.floor(
    (now.getTime() - subscriptionDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const canRefund = daysDifference <= 7

  return (
    <>
      <div className="mt-4 flex gap-3">
        <Button
          onClick={() => openModal('cancel')}
          disabled={loading !== null}
          variant="destructive"
          className="flex-1"
        >
          {loading === 'cancel' ? 'Cancelando...' : 'Cancelar Assinatura'}
        </Button>

        <Button
          onClick={() => openModal('upgrade')}
          disabled={loading !== null}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {loading === 'upgrade' ? 'Processando...' : 'Fazer Upgrade'}
        </Button>

        <Button
          onClick={() => openModal('refund')}
          disabled={loading !== null || !canRefund}
          variant="outline"
          className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-50"
        >
          {loading === 'refund' ? 'Processando...' : 'Solicitar Reembolso'}
        </Button>
      </div>

      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        type={modalType || 'cancel'}
        loading={loading !== null}
      />
    </>
  )
}
