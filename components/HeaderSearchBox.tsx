'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function HeaderSearchBox() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (query.trim().length < 2) {
      return
    }

    const searchUrl = `/search?query=${encodeURIComponent(query)}&page=1`

    try {
      router.push(searchUrl)
    } catch (error) {}
  }

  return (
    <form
      onSubmit={e => {
        handleSubmit(e)
      }}
      className="mx-auto flex w-full max-w-xl items-center justify-center gap-2"
      role="search"
    >
      <Input
        type="search"
        placeholder="Busque por temas, palavras ou termos em hebraico/transliterado..."
        value={query}
        onChange={e => {
          setQuery(e.target.value)
        }}
        className="flex-1 rounded-full px-4 py-6 text-lg shadow"
        aria-label="Buscar nos tratados"
      />
      <Button
        type="submit"
        size="lg"
        className="rounded-full px-6 text-lg font-semibold"
        onClick={e => {
          e.preventDefault()
          handleSubmit(e)
        }}
      >
        Buscar
      </Button>
    </form>
  )
}
