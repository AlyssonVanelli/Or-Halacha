'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { XCircle } from 'lucide-react'

export default function PaymentCancel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [canShow, setCanShow] = useState(false)

  useEffect(() => {
    if (searchParams && searchParams.get('checkout') === 'fail') {
      setCanShow(true)
    } else {
      setCanShow(false)
      router.replace('/planos')
    }
  }, [router, searchParams])

  if (!canShow) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-background">
      <div className="flex flex-col items-center rounded-xl bg-card p-10 shadow-lg">
        <XCircle className="mb-4 h-16 w-16 animate-bounce text-red-500" />
        <h1 className="mb-2 text-4xl font-extrabold text-primary">Pagamento não realizado</h1>
        <p className="mb-6 max-w-md text-center text-lg text-muted-foreground">
          Ocorreu um problema ou você cancelou o pagamento.
          <br />
          Sua assinatura não foi ativada. Se precisar de ajuda, entre em contato com o suporte.
        </p>
        <a
          href="/planos"
          className="rounded-lg bg-primary px-8 py-3 font-semibold text-white shadow transition hover:bg-primary/90"
        >
          Voltar para os Planos
        </a>
      </div>
      <div className="mt-10 max-w-lg text-center text-sm text-muted-foreground">
        Se o problema persistir, fale com nosso suporte pelo WhatsApp ou e-mail.
        <br />
        Estamos aqui para ajudar!
      </div>
    </div>
  )
}
