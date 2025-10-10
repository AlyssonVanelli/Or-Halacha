'use client'
// /components/FaqAccordion.tsx
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageCircle, HelpCircle } from 'lucide-react'

type FaqItem = {
  question: string
  answer: string
}

const FAQS: FaqItem[] = [
  {
    question: 'O que é o Or Halacha?',
    answer:
      'Or Halacha é uma plataforma em Português com ensinamentos e decisões de Halachá, baseada nos quatro tratados do Shulchan Aruch, para facilitar seu estudo e consulta.',
  },
  {
    question: 'Como funciona a minha dashboard?',
    answer:
      'Após o login, você acessa o dashboard onde pode filtrar e navegar pelos quatro tratados do Shulchan Aruch, salvando favoritos para consulta rápida.',
  },
  {
    question: 'O que é Halachá?',
    answer:
      'Halachá é o conjunto de leis e práticas judaicas que regem a vida diária do judeu. Baseia-se na Torá escrita, na Torá oral (Talmud) e nas decisões dos sábios ao longo dos séculos.',
  },
  {
    question: 'O que é o Shulchan Aruch?',
    answer:
      'O Shulchan Aruch (Mesa Posta) é um código de leis judaicas compilado por Rabi Yosef Karo no século XVI. É dividido em quatro tratados: Orach Chayim (modo de vida), Yoreh Deah (ensina conhecimento), Even HaEzer (pedra de ajuda) e Choshen Mishpat (peitoral do juízo).',
  },
  {
    question: 'Qual a diferença entre os tratados?',
    answer:
      'Orach Chayim trata de orações, Shabat e festas; Yoreh Deah aborda leis de kashrut, luto e conversão; Even HaEzer cuida do casamento e divórcio; Choshen Mishpat trata de leis comerciais e judiciais.',
  },
  {
    question: 'Como estudar Halachá de forma eficiente?',
    answer:
      'Comece com um tratado específico, leia os comentários explicativos, pratique com situações do dia a dia, e consulte fontes adicionais quando necessário. A plataforma oferece explicações práticas para facilitar o entendimento.',
  },
  {
    question: 'Posso usar a plataforma para decisões haláchicas pessoais?',
    answer:
      'A plataforma serve como ferramenta de estudo e consulta. Para decisões haláchicas pessoais importantes, sempre consulte um rabino qualificado que conheça sua situação específica.',
  },
  {
    question: 'Como funciona o sistema de favoritos?',
    answer:
      'Você pode marcar qualquer seif (parágrafo) como favorito clicando no ícone de estrela. Os favoritos ficam salvos em sua conta e podem ser acessados rapidamente na seção "Favoritos" do dashboard.',
  },
  {
    question: 'A plataforma é adequada para iniciantes?',
    answer:
      'Sim! A plataforma foi desenvolvida para ser acessível tanto para iniciantes quanto para estudiosos avançados. As explicações práticas ajudam a entender conceitos complexos de forma clara.',
  },
  {
    question: 'Posso sugerir novos conteúdos?',
    answer:
      'Sim! Na seção de Suporte você pode enviar sugestões de temas, correções ou comentários sobre o conteúdo. Sua contribuição é muito valiosa para melhorar a plataforma.',
  },
  {
    question: 'Como funciona a pesquisa avançada?',
    answer:
      'A pesquisa permite buscar por palavras-chave em todos os tratados simultaneamente. Você pode filtrar por tratado específico, siman (capítulo) ou usar termos em português ou hebraico.',
  },
  {
    question: 'O conteúdo é baseado em qual tradição haláchica?',
    answer:
      'O conteúdo segue a tradição sefardita conforme o Shulchan Aruch original, mas inclui também decisões ashkenazitas quando relevante, sempre indicando as diferenças entre as tradições.',
  },
]

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section id="faq" className="py-16">
      <div className="mb-12 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-3">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-3xl font-bold tracking-tighter text-transparent sm:text-4xl md:text-5xl">
          Perguntas Frequentes
        </h2>
        <p className="mx-auto mt-4 max-w-[600px] text-lg text-gray-600">
          Tire suas dúvidas sobre Halachá e nossa plataforma
        </p>
      </div>
      
      <div className="mx-auto max-w-4xl space-y-3">
        {FAQS.map((item, i) => (
          <div
            key={i}
            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-blue-200"
          >
            <button
              onClick={() => toggle(i)}
              className="flex w-full items-center justify-between p-6 text-left transition-all duration-200 hover:bg-gray-50"
            >
              <span className="pr-6 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                {item.question}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-200 ${
                  openIndex === i ? 'rotate-180 bg-gradient-to-r from-indigo-500 to-blue-500' : ''
                }`}
              >
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>
            {openIndex === i && (
              <div className="border-t border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-6">
                <p className="leading-relaxed text-gray-700">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8 shadow-lg">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-3">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">
            Ainda tem dúvidas?
          </h3>
          <p className="mb-6 text-gray-600">
            Nossa equipe de suporte está pronta para ajudar com suas questões sobre Halachá e o uso da plataforma.
          </p>
          <Link href="/suporte">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-lg font-semibold shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl">
              Contatar Suporte
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
