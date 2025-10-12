'use client'

// import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, AlertTriangle, CreditCard, RotateCcw } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  type: 'cancel' | 'upgrade' | 'refund'
  loading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  loading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const getModalContent = () => {
    switch (type) {
      case 'cancel':
        return {
          icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
          title: 'Cancelar Assinatura',
          description: 'Tem certeza que deseja cancelar sua assinatura?',
          details: [
            'Você manterá o acesso até o fim do período atual',
            'Não será cobrado na próxima renovação',
            'Poderá reativar a qualquer momento',
          ],
          confirmText: 'Sim, Cancelar',
          confirmVariant: 'destructive' as const,
        }

      case 'upgrade':
        return {
          icon: <CreditCard className="h-8 w-8 text-blue-500" />,
          title: 'Fazer Upgrade',
          description: 'Você será redirecionado para o checkout do Stripe',
          details: [
            'Seu plano atual será atualizado',
            'A cobrança será processada imediatamente',
            'Você terá acesso às novas funcionalidades',
          ],
          confirmText: 'Continuar',
          confirmVariant: 'default' as const,
        }

      case 'refund':
        return {
          icon: <RotateCcw className="h-8 w-8 text-red-500" />,
          title: 'Solicitar Reembolso',
          description: 'Tem certeza que deseja solicitar reembolso?',
          details: [
            'Esta ação não pode ser desfeita',
            'Sua assinatura será cancelada imediatamente',
            'O valor será estornado em 5-10 dias úteis',
          ],
          confirmText: 'Sim, Solicitar',
          confirmVariant: 'destructive' as const,
        }

      default:
        return {
          icon: <AlertTriangle className="h-8 w-8 text-gray-500" />,
          title: 'Confirmar',
          description: 'Tem certeza que deseja continuar?',
          details: [],
          confirmText: 'Confirmar',
          confirmVariant: 'default' as const,
        }
    }
  }

  const content = getModalContent()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {content.icon}
                <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
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
            <p className="mb-4 text-gray-700">{content.description}</p>

            {content.details.length > 0 && (
              <div className="mb-6 rounded-lg bg-gray-50 p-4">
                <ul className="space-y-2">
                  {content.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant={content.confirmVariant}
                onClick={onConfirm}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processando...' : content.confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
