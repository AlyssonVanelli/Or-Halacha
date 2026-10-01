import type { Metadata } from 'next'
import Link from 'next/link'
import { parseCheckoutItem } from '@/lib/hotmart'
import { HOTMART_BUYER_AREA_URL } from '@/lib/plans'
import { PublicShell } from '@/components/content/PublicShell'
import { SupportContact } from '@/components/SupportContact'

// Avisos do checkout (/checkout/[item] redireciona para cá quando não dá para ir ao pagamento)
export const metadata: Metadata = { title: 'Pagamento', robots: { index: false, follow: false } }

const buttonClass =
  'inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700'
const linkClass =
  'inline-block rounded-lg border border-blue-200 px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50'

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PublicShell>
      <div className="container mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">{title}</h1>
          <div className="space-y-4 text-gray-700">{children}</div>
        </div>
      </div>
    </PublicShell>
  )
}

export default async function CheckoutNoticePage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string; item?: string }>
}) {
  const { motivo, item: raw } = await searchParams
  const item = raw ? parseCheckoutItem(raw) : null

  if (motivo === 'assinante') {
    return (
      <Notice title="Você já é assinante">
        <p>
          Para trocar de plano (por exemplo, do Básico para o Plus ou do mensal para o anual),
          cancelar a renovação ou trocar o cartão, use a área do comprador da Hotmart, onde a
          assinatura foi feita: <b>Minhas compras → Or Halachá</b>.
        </p>
        <p className="text-sm text-gray-600">
          Cancelou a renovação? Você pode assinar de novo quando o período pago terminar.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={HOTMART_BUYER_AREA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass}
          >
            Abrir área do comprador
          </a>
          <Link href="/dashboard/perfil" className={linkClass}>
            Ver minha assinatura
          </Link>
        </div>
      </Notice>
    )
  }

  if (motivo === 'tratado-incluso') {
    const treatise = item?.kind === 'treatise' ? item.treatise : null
    return (
      <Notice title="Este tratado já está liberado">
        <p>Sua assinatura inclui os 4 tratados do Shulchan Aruch. Não é preciso comprar à parte.</p>
        <Link href={treatise ? `/tratado/${treatise.id}` : '/livros'} className={buttonClass}>
          {treatise ? `Abrir ${treatise.title}` : 'Ver tratados'}
        </Link>
      </Notice>
    )
  }

  return (
    <Notice title="Pagamentos em configuração">
      <p>
        Ainda estamos finalizando a configuração dos pagamentos. Tente de novo em breve ou fale com
        a gente pelo <SupportContact />.
      </p>
      <Link href="/planos" className={linkClass}>
        Voltar aos planos
      </Link>
    </Notice>
  )
}
