import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import type { SupportRequestCreate, SupportRequestResponse } from '@/types/support'
import { SUPPORT_MESSAGES, SUPPORT_CONFIG } from '@/constants/support'

type FormStatus = 'idle' | 'sending' | 'sent' | 'error'

interface UseSupportFormReturn {
  message: string
  setMessage: (message: string) => void
  status: FormStatus
  errorMessage: string
  isSubmitting: boolean
  handleSubmit: (e: React.FormEvent) => Promise<void>
  resetForm: () => void
}

export function useSupportForm(): UseSupportFormReturn {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const resetForm = () => {
    setMessage('')
    setStatus('idle')
    setErrorMessage('')
    setIsSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    // Validações
    if (message.length < SUPPORT_CONFIG.MIN_MESSAGE_LENGTH) {
      setErrorMessage(SUPPORT_MESSAGES.MIN_LENGTH)
      return
    }

    if (message.length > SUPPORT_CONFIG.MAX_MESSAGE_LENGTH) {
      setErrorMessage(SUPPORT_MESSAGES.MAX_LENGTH)
      return
    }

    setStatus('sending')
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/support/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message } as SupportRequestCreate),
      })

      const data = (await response.json()) as SupportRequestResponse

      if (!response.ok) {
        throw new Error(data.error || SUPPORT_MESSAGES.ERROR.DESCRIPTION)
      }

      setStatus('sent')
      setMessage('')

      toast({
        title: SUPPORT_MESSAGES.SUCCESS.TITLE,
        description: SUPPORT_MESSAGES.SUCCESS.DESCRIPTION,
        variant: 'default',
      })
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : SUPPORT_MESSAGES.ERROR.DESCRIPTION)

      toast({
        title: SUPPORT_MESSAGES.ERROR.TITLE,
        description: SUPPORT_MESSAGES.ERROR.DESCRIPTION,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    message,
    setMessage,
    status,
    errorMessage,
    isSubmitting,
    handleSubmit,
    resetForm,
  }
}
