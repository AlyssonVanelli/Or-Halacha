'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { SupportContact } from '@/components/SupportContact'

// Página de obrigado da Hotmart (configurada no produto). O acesso é liberado pelo webhook;
// aqui só esperamos a confirmação chegar.
const POLL_MS = 3000
const MAX_TRIES = 40 // ~2 minutos

type State = 'checking' | 'confirmed' | 'waiting'

export default function PaymentSuccessPage() {
  const { user, loading } = useAuth()
  const [state, setState] = useState<State>('checking')

  useEffect(() => {
    if (!user) return
    let tries = 0
    let timer: ReturnType<typeof setTimeout>
    let stopped = false

    async function check() {
      tries++
      try {
        const res = await fetch('/api/check-user-access', { method: 'POST' })
        const data = res.ok ? await res.json() : null
        if (data?.access?.hasAnyAccess) {
          setState('confirmed')
          return
        }
      } catch {
        // tenta de novo
      }
      if (stopped) return
      if (tries >= MAX_TRIES) setState('waiting')
      else timer = setTimeout(check, POLL_MS)
    }

    check()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [user])

  if (!loading && !user) {
    return (
      <Shell icon="clock" title="Entre para ver seu acesso">
        <p>
          Entre com o mesmo e-mail usado na compra. O acesso aparece na sua conta assim que a
          Hotmart confirma o pagamento.
        </p>
        <Button asChild className="w-full">
          <Link href="/login?redirect=/payment/success">Entrar</Link>
        </Button>
      </Shell>
    )
  }

  if (state === 'confirmed') {
    return (
      <Shell icon="check" title="Acesso liberado!">
        <p>Seu pagamento foi confirmado. Bom estudo!</p>
        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
          <Link href="/dashboard/biblioteca/shulchan-aruch">Ir para a biblioteca</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard/perfil">Ver minha assinatura</Link>
        </Button>
        <p className="text-sm text-gray-500">
          O recibo foi enviado pela Hotmart para o seu e-mail.
        </p>
      </Shell>
    )
  }

  if (state === 'waiting') {
    return (
      <Shell icon="clock" title="Aguardando a confirmação">
        <p>
          Ainda não recebemos a confirmação do pagamento. Se você pagou com Pix, confira se o
          pagamento foi concluído no app do banco. O acesso é liberado automaticamente assim que a
          Hotmart confirmar, e você recebe um e-mail.
        </p>
        <Button className="w-full" onClick={() => window.location.reload()}>
          Verificar de novo
        </Button>
        <p className="text-sm text-gray-500">
          Pagou com um e-mail diferente do da sua conta? Fale com a gente pelo <SupportContact />.
        </p>
      </Shell>
    )
  }

  return (
    <Shell icon="clock" title="Confirmando seu pagamento…">
      <div
        className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent"
        role="status"
        aria-label="Verificando"
      />
      <p>No cartão leva alguns segundos; no Pix, assim que o pagamento cai.</p>
    </Shell>
  )
}

function Shell({
  icon,
  title,
  children,
}: {
  icon: 'check' | 'clock'
  title: string
  children: React.ReactNode
}) {
  const Icon = icon === 'check' ? CheckCircle : Clock
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Icon className="h-8 w-8 text-green-600" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="space-y-4 text-gray-700">{children}</div>
      </div>
    </div>
  )
}
