'use client'

import { useState, useEffect } from 'react'

export function useRateLimitCountdown(initialSeconds: number = 900) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (seconds <= 0) {
      setIsExpired(true)
      return
    }

    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setIsExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [seconds])

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${remainingSeconds}s`
  }

  return {
    seconds,
    isExpired,
    formattedTime: formatTime(seconds),
    minutes: Math.floor(seconds / 60),
    remainingSeconds: seconds % 60
  }
}
