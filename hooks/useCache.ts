import { useState, useEffect } from 'react'

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  key: string
}

export function useCache<T>(options: CacheOptions) {
  const { ttl = 5 * 60 * 1000, key } = options // Default 5 minutes
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFromCache, setIsFromCache] = useState(false)

  const getCachedData = (): T | null => {
    try {
      const cachedData = localStorage.getItem(key)
      const cacheTime = localStorage.getItem(`${key}-time`)
      
      if (cachedData && cacheTime) {
        const now = Date.now()
        const timeDiff = now - parseInt(cacheTime)
        
        if (timeDiff < ttl) {
          return JSON.parse(cachedData)
        } else {
          // Cache expirado, remover
          localStorage.removeItem(key)
          localStorage.removeItem(`${key}-time`)
        }
      }
    } catch (error) {
      console.error('Erro ao ler cache:', error)
    }
    
    return null
  }

  const setCachedData = (newData: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(newData))
      localStorage.setItem(`${key}-time`, Date.now().toString())
      setData(newData)
    } catch (error) {
      console.error('Erro ao salvar cache:', error)
    }
  }

  const fetchData = async (fetchFunction: () => Promise<T>) => {
    // Verificar cache primeiro
    const cachedData = getCachedData()
    if (cachedData) {
      setData(cachedData)
      setIsFromCache(true)
      return cachedData
    }

    // Se não há cache, fazer requisição
    setIsLoading(true)
    setIsFromCache(false)
    
    try {
      const result = await fetchFunction()
      setCachedData(result)
      return result
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const clearCache = () => {
    localStorage.removeItem(key)
    localStorage.removeItem(`${key}-time`)
    setData(null)
  }

  return {
    data,
    isLoading,
    isFromCache,
    fetchData,
    clearCache,
    setData
  }
}
