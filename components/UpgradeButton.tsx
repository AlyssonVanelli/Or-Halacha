'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp, CreditCard } from 'lucide-react'
import SubscriptionUpgradeModal from './SubscriptionUpgradeModal'

interface UpgradeButtonProps {
  currentPlan: {
    id: string
    name: string
    price: number
    interval: 'month' | 'year'
    isPlus: boolean
    stripePriceId: string
  } | null
  customerId: string
  currentSubscriptionId: string | null
  onSuccess: (newSubscriptionId: string) => void
}

export default function UpgradeButton({
  currentPlan,
  customerId,
  currentSubscriptionId,
  onSuccess,
}: UpgradeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSuccess = (newSubscriptionId: string) => {
    onSuccess(newSubscriptionId)
    setIsModalOpen(false)
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <ArrowUp className="h-4 w-4 mr-2" />
        {currentPlan ? 'Fazer Upgrade' : 'Renovar Assinatura'}
      </Button>

      <SubscriptionUpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentPlan={currentPlan}
        customerId={customerId}
        currentSubscriptionId={currentSubscriptionId}
        onSuccess={handleSuccess}
      />
    </>
  )
}
