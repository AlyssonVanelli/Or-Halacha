import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canReadDivision, getUserAccess } from '@/lib/content/server'
import { DIVISION_BLURBS, TREATISES } from '@/lib/content/divisions'
import { PublicShell } from '@/components/content/PublicShell'
import { TREATISE_PRICE, brl } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Tratados do Shulchan Aruch',
  description:
    'Os 4 tratados do Shulchan Aruch em português: Orach Chayim, Yoreh De’ah, Even HaEzer e Choshen Mishpat. Leia o índice grátis ou compre um tratado por 1 mês.',
  alternates: { canonical: '/livros' },
}

export default async function LivrosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const access = await getUserAccess(user?.id)

  const { data } = await createAdminClient()
    .from('divisions')
    .select('id, title, description')
    .in(
      'id',
      TREATISES.map(t => t.id)
    )
  const divisions = TREATISES.map(t => {
    const row = (data || []).find(d => d.id === t.id)
    return {
      id: t.id,
      title: (row?.title as string | undefined) || t.title,
      description: DIVISION_BLURBS[t.title] || (row?.description as string | null) || null,
    }
  })

  return (
    <PublicShell>
      <section className="container max-w-4xl px-4 py-10 text-center">
        <div className="mb-3 flex justify-center">
          <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-2">
            <BookOpen className="h-5 w-5 text-white" aria-hidden />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Tratados do Shulchan Aruch
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          O índice de cada tratado é aberto a todos. Para ler um tratado inteiro, compre o acesso
          por 1 mês ({brl(TREATISE_PRICE)}, pagamento único) ou{' '}
          <Link href="/planos" className="font-semibold text-blue-700 underline">
            assine e leia os 4
          </Link>
          .
        </p>
      </section>

      <section className="container max-w-4xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {divisions.map(div => {
            const unlocked = canReadDivision(access, div.id)
            return (
              <div
                key={div.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-lg"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{div.title}</h2>
                  {unlocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      <CheckCircle className="h-4 w-4" aria-hidden /> Liberado
                    </span>
                  )}
                </div>
                {div.description && (
                  <p className="mb-5 flex-1 text-sm text-gray-600">{div.description}</p>
                )}
                <div className="mt-auto space-y-2">
                  <Link
                    href={`/tratado/${div.id}`}
                    className="block w-full rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700"
                  >
                    {unlocked ? 'Abrir' : 'Ver índice'}
                  </Link>
                  {!unlocked && (
                    <Link
                      href={`/checkout/${div.id}`}
                      prefetch={false}
                      className="block w-full rounded-md border border-blue-200 px-3 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-50"
                    >
                      Comprar · {brl(TREATISE_PRICE)} por 1 mês
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </PublicShell>
  )
}
