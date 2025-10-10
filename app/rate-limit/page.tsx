'use client'

import { RateLimitError } from '@/components/RateLimitError'
import { useEffect, useState } from 'react'

export default function RateLimitPage() {
  const [retryAfter, setRetryAfter] = useState(900) // 15 minutos por padrão

  useEffect(() => {
    // Tentar obter o tempo de retry dos headers se disponível
    const retryAfterHeader = document.querySelector('meta[name="retry-after"]')
    if (retryAfterHeader) {
      const value = parseInt(retryAfterHeader.getAttribute('content') || '900')
      setRetryAfter(value)
    }
  }, [])

  return <RateLimitError retryAfter={retryAfter} />
}
