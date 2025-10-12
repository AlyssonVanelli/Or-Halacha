import { useState, useCallback } from 'react'

interface UseCounterProps {
  initialValue?: number
}

export function useCounter({ initialValue = 0 }: UseCounterProps = {}) {
  const [count, setCount] = useState(initialValue)

  const increment = useCallback(() => {
    setCount(prev => prev + 1)
  }, [])

  const decrement = useCallback(() => {
    setCount(prev => prev - 1)
  }, [])

  const reset = useCallback(() => {
    setCount(initialValue)
  }, [initialValue])

  return {
    count,
    increment,
    decrement,
    reset,
  }
}
