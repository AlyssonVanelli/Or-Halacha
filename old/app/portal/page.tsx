'use client'

import { useEffect, useState } from 'react'

export default function PortalPage() {
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchPortal() {
      setLoading(true)
      const res = await fetch('/api/create-customer-portal-session', { method: 'POST' })
      const data = await res.json()
      setPortalUrl(data.url)
      setLoading(false)
    }
    fetchPortal()
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-3xl font-bold">Gerenciar Assinatura</h1>
      <p className="mb-8">
        Acesse o portal do cliente Stripe para atualizar, cancelar ou ver detalhes da sua
        assinatura.
      </p>
      <button
        className="rounded bg-primary px-6 py-2 text-white"
        onClick={() => portalUrl && window.location.assign(portalUrl)}
        disabled={!portalUrl || loading}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          'Abrir Portal de Assinante'
        )}
      </button>
    </div>
  )
}
