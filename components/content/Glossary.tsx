import { HelpCircle } from 'lucide-react'

export const GLOSSARY: Array<{ term: string; meaning: string }> = [
  {
    term: 'Halachá',
    meaning: 'A lei judaica: o conjunto de normas práticas que orientam o dia a dia no judaísmo.',
  },
  {
    term: 'Shulchan Aruch',
    meaning:
      '"Mesa Posta". Código de lei judaica escrito pelo Rabi Yossef Caro no século XVI, com as notas do Rabi Moshe Isserles (Rema).',
  },
  {
    term: 'Tratado',
    meaning:
      'Cada uma das 4 grandes partes do Shulchan Aruch: Orach Chayim (rotina, rezas, Shabat e festas), Yoreh De’ah (cashrut, luto e outros temas), Even HaEzer (casamento e divórcio) e Choshen Mishpat (direito civil e tribunais).',
  },
  { term: 'Siman', meaning: 'Capítulo. Cada siman trata de um assunto específico.' },
  { term: 'Seif (plural: seifim)', meaning: 'Parágrafo numerado dentro de um siman.' },
  {
    term: 'Nota do Rema',
    meaning:
      'Comentário do Rabi Moshe Isserles, que registra o costume dos judeus asquenazitas quando ele difere.',
  },
  {
    term: 'Explicação prática',
    meaning:
      'Exclusiva do plano Plus: explica em linguagem simples o que o seif significa e como se aplica hoje.',
  },
]

export function Glossary({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-blue-100 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
        <HelpCircle className="h-5 w-5" aria-hidden="true" />
        Novo no estudo? Entenda os termos
        <span className="ml-auto text-sm font-normal text-gray-500 group-open:hidden">mostrar</span>
        <span className="ml-auto hidden text-sm font-normal text-gray-500 group-open:inline">
          ocultar
        </span>
      </summary>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {GLOSSARY.map(item => (
          <div key={item.term}>
            <dt className="font-semibold text-gray-900 dark:text-gray-100">{item.term}</dt>
            <dd className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {item.meaning}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-gray-500">
        Conteúdo para estudo. Para decisões práticas da vida religiosa, consulte um rabino de sua
        confiança.
      </p>
    </details>
  )
}
