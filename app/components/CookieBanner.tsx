// /components/CookieBanner.tsx
import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'

type ConsentType = 'essential' | 'analytics' | 'marketing'

export default function CookieBanner() {
  const { user } = useAuth()
  const consentCookieName = 'orhalacha_cookie_consent'

  const [show, setShow] = useState(false)
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({
    essential: false,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    const seen = document.cookie.split('; ').find(row => row.startsWith(`${consentCookieName}=`))
    if (!seen) setShow(true)
    else setShow(false)
  }, [consentCookieName])

  const handleChange = (type: ConsentType) => {
    setConsents(prev => ({ ...prev, [type]: !prev[type] }))
  }

  const handleAccept = async () => {
    // garante consentimento essencial sempre
    const toSave: ConsentType[] = ['essential']
    if (consents.analytics) toSave.push('analytics')
    if (consents.marketing) toSave.push('marketing')

    // Visitante sem login: a escolha fica só no cookie do navegador
    if (user) {
      await Promise.all(
        toSave.map(ct =>
          fetch('/api/consent/record-consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consent_type: ct }),
          }).catch(() => undefined)
        )
      )
    }

    // marca no cookie para não mostrar de novo (1 ano)
    document.cookie = `${consentCookieName}=true;max-age=${60 * 60 * 24 * 365};path=/`
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 z-[1000] flex w-full justify-center"
      role="dialog"
      aria-label="Preferências de cookies"
    >
      <div className="animate-fade-in pointer-events-auto mx-3 mb-3 flex w-full max-w-md flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:mb-6 sm:gap-3 sm:p-6">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl">🍪</span>
          <h4 className="text-lg font-semibold">Usamos cookies</h4>
        </div>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
          Escolha quais tipos você aceita para melhorar sua experiência:
        </p>
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked disabled />
            Essenciais (necessários para o site funcionar)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={consents.analytics}
              onChange={() => handleChange('analytics')}
            />
            Analytics (estatísticas de uso)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={consents.marketing}
              onChange={() => handleChange('marketing')}
            />
            Marketing (promoções e parceiros)
          </label>
        </div>
        <button
          onClick={handleAccept}
          className="mt-2 w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Aceitar selecionados
        </button>
      </div>
    </div>
  )
}
