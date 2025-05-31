'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function PaymentSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [canShow, setCanShow] = useState(false)

  useEffect(() => {
    if (searchParams && searchParams.get('checkout') === 'ok') {
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
        <CheckCircle className="mb-4 h-16 w-16 animate-bounce text-green-500" />
        <h1 className="mb-2 text-4xl font-extrabold text-primary">
          Bem-vindo à sua nova experiência de estudo!
        </h1>
        <p className="mb-6 max-w-md text-center text-lg text-muted-foreground">
          Pagamento realizado com sucesso.
          <br />
          Sua assinatura foi ativada e você já pode acessar todo o conteúdo exclusivo do Shulchan
          Aruch em português, com explicações práticas.
        </p>
        <a
          href="/dashboard"
          className="rounded-lg bg-primary px-8 py-3 font-semibold text-white shadow transition hover:bg-primary/90"
        >
          Ir para o Dashboard
        </a>
      </div>
      <div className="mt-10 max-w-lg text-center text-sm text-muted-foreground">
        Dúvidas ou problemas? Fale com nosso suporte pelo WhatsApp ou e-mail.
        <br />
        Obrigado por apoiar o estudo da Halachá em português!
      </div>
    </div>
  )
}
