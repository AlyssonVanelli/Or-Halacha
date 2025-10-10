'use client'

import { useState } from 'react'
import { DashboardAccessGuard } from '@/components/DashboardAccessGuard'
import { ChevronDown, ChevronUp, HelpCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type FaqItem = {
  id: string
  question: string
  answer: string
  context?: string
  commonErrors?: string[]
  references?: string[]
}

const FAQS: FaqItem[] = [
  {
    id: 'tzadik-death',
    question: 'A morte de um tzadik expia pecados?',
    answer:
      'Expiação aqui = efeito moral/espiritual: a perda de um justo mexe com a gente → chorar, orar, reparar, mudar.\n\nIsso é teshuvá. Ninguém "morre no lugar" de outro.',
    context:
      'Moed Katan 28a: "mitat tzadikim mechaperet" — a morte dos justos "expia" por mérito que sacode o povo para teshuvá (não é sacrifício humano).\n\nRashi a Bamidbar 20:1: liga o falecimento de Miriam com a Pará Adumá para ensinar mérito/recordação que inspira mudança.\n\nYoma 85b: morte e Yom Kipur só exp(i)am com teshuvá; sem teshuvá, não expiam.\n\nBerakhot 32b: "os portões das lágrimas não se fecham".',
    commonErrors: [
      'Substituição penal ("alguém morre por mim"): a Torá nega (Devarim 24:16; Yechezkel 18:20)',
      '"Yom Kipur sozinho resolve": sem teshuvá, não (Yoma 85b)',
      'Pecado contra pessoa resolvido só com Deus: não; exige apaziguar o ofendido',
    ],
    references: [
      'Moed Katan 28a',
      'Yoma 85b',
      'Berakhot 32b',
      'Rashi a Bamidbar 20:1',
      'Devarim 24:16',
      'Yechezkel 18:20',
    ],
  },
  {
    id: 'maaser-income',
    question: '"Dízimo" vale para qualquer renda?',
    answer:
      "Dízimo bíblico é agrícola/animal em Eretz Israel.\n\n10% do salário hoje = tzedaká (excelente!), não é o ma'aser da Torá.",
    context:
      "Ma'aser na Torá = décima parte de grãos, vinho, azeite e rebanhos, na Terra de Israel.\n\nMa'aser Rishon → Levi (Números 18).\n\nMa'aser Sheni (anos 1,2,4,5) → levar a Jerusalém e consumir lá (ou resgatar e gastar lá em comida) (Devarim 14; 26).\n\nMa'aser Ani (anos 3 e 6) → pobres (Devarim 14; 26).\n\nMa'aser Behemá (rebanho) (Levítico 27).\n\nHoje: separações agrícolas em Israel têm força rabínica; salário/lucro não são \"o dízimo da Torá\". Dar 10% do salário é tzedaká (Shulchan Aruch, Yoreh Deah 249).",
    commonErrors: [
      'Falar em "três dízimos de dinheiro" hoje: não existe fora de israel e sem ser produção na terra de israel',
      'Dizer que dízimo bíblico vai para alguem: na Torá vai para Levi no sistema do Templo',
      'Dar tzedaká (10% padrão; ideal 20%); não chamar tzedaká de "ma\'aser bíblico"',
    ],
    references: [
      'Levítico 27',
      'Números 18',
      'Devarim 14:22–29',
      '26:12–15',
      "Mishná Ma'aserot/Ma'aser Sheni",
      "Rambam, Hilchot Terumot e Hilchot Ma'aser Sheni",
      'Shulchan Aruch, Yoreh Deah 249, 331–334',
    ],
  },
  {
    id: 'korban-reading',
    question: 'Ler os korbanot = oferecer sacrifício?',
    answer:
      'Ler korbanot é estudo e lembrança, com mérito simbólico.\n\nNão é ofertar de verdade. Simular korban hoje é proibido.',
    context:
      'Menachot 110a: quem estuda as leis de um korban recebe mérito "como se" (ke\'ilu) tivesse trazido.\n\nHoshea 14: "pagaremos com os lábios" — oração/estudo no lugar do boi.\n\nShulchan Aruch, Orach Chaim 1:5; 50:1: recitar Parashat HaTamid, Eizehu Mekoman e Baraita de R. Ishmael no ciclo diário.\n\nDevarim 12; 16: culto centralizado; korban só no Lugar Escolhido (Templo).',
    commonErrors: [
      'Dizer que leitura "vale literalmente" como sacrificar',
      '"Dramatizar sacrifício"',
      'Manter as leituras; entender que é estudo; evitar encenação',
    ],
    references: [
      'Menachot 110a',
      'Hoshea 14',
      'Shulchan Aruch, Orach Chaim 1:5',
      '50:1',
      'Devarim 12',
      '16',
    ],
  },
  {
    id: 'pesach-timing',
    question: 'Pêssach — Qual o dia do korban e qual o dia de comer',
    answer:
      'Dia do abate: 14 de Nisã (Êx 12:6; Lv 23:5; Nm 9:3, 5; 28:16).\n\nHorário: à tarde do 14.\n\nÊxodo 12:6 usa o termo técnico בֵּין הָעַרְבַּיִם / bein ha\'arbayim.\n\nDeuteronômio 16:6 e Josué 5:10 não usam bein ha\'arbayim; dizem בָּעֶרֶב / ba\'erev ("à tarde", "ao pôr-do-sol").\n\n→ Fim da tarde do próprio 14.',
    context:
      'Prática do Templo (halachá + história):\n\nMishná Pesachim 5; Pesachim 58a, 61a: Pêssach no fim da tarde, após o tamid vespertino.\n\nFlávio Josefo (Antiguidades; Guerras): abate entre a 9ª e a 11ª hora (≈ 15h–17h). Confirma bein ha\'arbayim = final da tarde do 14.\n\n"Naquela noite" come-se Pêssach com matzá e maror e narra-se o Êxodo (Êx 12:8–12) — essa noite já é 15.\n\n"לֵיל שִׁמֻּרִים / leil shimurim" — noite de vigílias (Êx 12:42).\n\nPesachim 116a: "Quem se alonga em contar a saída do Egito é louvável."\n\nHoje: sem Mikdash não há korban (proibido "imitar"); fazemos afikoman como zecher e nos alongamos na narrativa (Shulchan Aruch OC 476–477).',
    commonErrors: [
      '"Seder no começo do 14 (13→14) é o bíblico." → Não. Abate tarde do 14; comer/narrar noite do 15 (Êx 12; Dt 16:6; Js 5:10)',
      '"Bein ha\'arbayim = noite do 14." → Não. Dt 16:6 e Js 5:10 dizem "à tarde" do 14, ao pôr-do-sol',
      '"Hoje dá pra imitar o korban." → Proibido (Devarim 12; 16; Shulchan Aruch OC 476–477)',
      '"No dia seguinte ao Pêssach"; Nm 33:3 = o dia após o sacrifício de Pêssach (Korban Pêssach) feito no dia 14 à tarde; portanto refere-se ao dia 15 de Nissan, quando Israel saiu de Ramessés — "no dia seguinte ao sacrifício de Pêssach…", o dia 14 inteiro não é pessach, ele é um korban e não um dia.',
    ],
    references: [
      'Êxodo 12:6, 8–12, 29–33, 42',
      'Levítico 23:5',
      'Números 9:3, 5; 28:16; 33:3',
      'Deuteronômio 16:1, 6',
      'Josué 5:10',
      'Mishná Pesachim 5',
      'Pesachim 58a, 61a',
      'Shulchan Aruch OC 476–477',
      'Flávio Josefo, Antiguidades dos Judeus',
      'Guerras dos Judeus',
    ],
  },
  {
    id: 'exile-forgiveness',
    question: 'Sem sacrifícios no exílio = sem perdão/salvação?',
    answer:
      'Sem Templo também tem perdão: teshuvá + tefilá + tzedaká.\n\nSe feri alguém, reparo e peço perdão ao ofendido.',
    context:
      'Daniel 6: Daniel ora 3× ao dia voltado para Jerusalém no exílio.\n\n1 Reis 8:46–50: Shlomô — se pecarem, forem exilados e orarem voltados à Terra/Cidade, Deus ouve e perdoa.\n\nJeremias 29:10–14: buscar a Deus no exílio → Ele ouve e traz de volta.\n\nEzequiel 11:16; Meguilá 29a: sinagogas/beit midrash = "mikdash me\'at" (pequenos santuários).\n\nHoshea 14: "tomaremos touros com os lábios" — oração no lugar de bois.\n\nBerakhot 32b: "portões das lágrimas não se fecham".',
    references: [
      'Daniel 6',
      '1 Reis 8:46–50',
      'Jeremias 29:10–14',
      'Ezequiel 11:16',
      'Meguilá 29a',
      'Hoshea 14',
      'Berakhot 32b',
    ],
  },
  {
    id: 'messiah-torah',
    question: 'Messias segundo a Torá',
    answer:
      'Só Deus salva e perdoa (Shema: Devarim 6:4).\n\nDeus não é homem (Números 23:19; 1 Samuel 15:29; Hoshea 11:9).\n\n"Fora de Mim não há salvador" (Isaías 43:11; Hoshea 13:4).\n\nConclusão: Mashiach não é "salvador vicário" de pecados.',
    context:
      'O Mashiach é um rei davídico que governa pela Torá (Devarim 17:14–20).\n\nCritérios Rambam, Hilchot Melachim 11–12 (verificáveis):\n\nDescendente de Davi (via Salomão), grande sábio;\n\nFaz Israel guardar a Torá;\n\nLuta as guerras de Hashem;\n\nReconstrói o Templo;\n\nReúne os exilados.\n\nSe morre sem completar, não era (não existe "segunda vinda" codificada).\n\nComparações corretas: como Moshê (guia, organiza a Torá em Israel) e como Davi (rei, guerreiro de Hashem, governa pela Torá).\n\nNão é divino. Não é mago/curandeiro de palco. Não muda a Torá (Devarim 13).',
    commonErrors: [
      'Isaías 53 (bloco 40–55): "Servo" é Israel em várias passagens (ex.: 49:3); 53:10 — "verá descendência e prolongará dias" — incompatível com morte vicária única',
      'Isaías 7:14: contexto siro-efraimita; sinal para Acaz na sua geração; almah = moça jovem',
      'Miquéias 5:2: "saídas de outrora" = linhagem davídica antiga, não "pré-existência divina"',
      'Salmo 22: lamento de Davi; leitura judaica padrão "como um leão" (כָּאֲרִי) nas mãos e pés',
      'Salmo 110: salmo régio; la\'Adoni ("ao meu senhor" humano), não Adonai',
      'Zacarias 12: cerco/luto nacional; "olharão para Mim por causa daquele que traspassaram" → luto por um morto justo; contexto da Casa de Davi',
      'Zacarias 9:9: rei humilde sobre jumento (símbolo de paz); Sábios: pode vir nas nuvens (mérito) ou sobre jumento (Sanhedrin 98a) — cenários, não divindade',
      'Daniel 9: oração/confissão + "70 semanas" ligadas a Jerusalém/Templo; leituras judaicas identificam "ungidos" com Ciro, sumo-sacerdote etc',
      'Oséias 11:1: refere-se a Israel saindo do Egito',
      'Jeremias 31:31–34: "nova aliança" = Torá no coração; não ab-roga a Torá; Devarim 13 proíbe seguir quem muda a lei',
      'Devarim 18:15–22: "profeta como Moshê" = linha de profetas; critérios para rejeitar quem altera culto/lei',
    ],
    references: [
      'Devarim 6:4',
      'Números 23:19',
      '1 Samuel 15:29',
      'Isaías 43:11',
      'Hoshea 13:4',
      'Devarim 17:14–20',
      'Rambam, Hilchot Melachim 11–12',
      'Devarim 13',
      'Isaías 53',
      'Isaías 7:14',
      'Miquéias 5:2',
      'Salmo 22',
      'Salmo 110',
      'Zacarias 12',
      'Zacarias 9:9',
      'Daniel 9',
      'Oséias 11:1',
      'Jeremias 31:31–34',
      'Devarim 18:15–22',
    ],
  },
  {
    id: 'veil-torn',
    question: '"Rasgou-se o véu do Santo dos Santos?"',
    answer:
      '"Véu rasgado" não aparece nas fontes rabínicas.\n\nHavia duas cortinas internas.\n\nSe rasga, a halachá manda reparar/substituir — é manutenção, não "fim do sistema".',
    context:
      'Yoma 51b–52b: no Segundo Templo havia duas cortinas (parochet); o Cohen Gadol entrava entre elas em Yom Kipur.\n\nShekalim 8:5 (e correlatos): cortinas imensas e espessas; cita-se até 300 cohanim para a imersão ritual.\n\nYoma 39b: presságios negativos nos 40 anos finais antes de 70 EC (laço vermelho não embranquece, lâmpada ocidental apaga, portas se abrem) — nenhuma menção de "parochet rasgada".\n\nYoma 5:1: no Kodesh HaKodashim do 2º Templo não havia Arca; havia a Even haShtiyá.',
    commonErrors: [
      'Dizer que o "véu rasgado" prova o fim dos sacrifícios',
      'Imaginar a Arca ali no 2º Templo — não estava',
    ],
    references: ['Yoma 51b–52b', 'Shekalim 8:5', 'Yoma 39b', 'Yoma 5:1'],
  },
  {
    id: 'psalm-118-22',
    question: 'Salmo 118:22 — "A pedra que os construtores rejeitaram…"',
    answer:
      '"Pedra" = Israel e/ou Davi (liderança que Deus escolheu).\n\n"Construtores" = líderes/eruditos do povo (Berakhot 64a).\n\n"Rosh pinná" = pedra angular (cf. Isaías 28:16) — base que alinha o "prédio" (a liderança legítima).',
    context:
      'Salmo litúrgico do Hallel (Salmos 113–118) — procissão/agradecimento nacional (cf. Pesachim 117a).\n\nClima de entrada pelos portões, "Baruch Haba", exaltação de quem era desprezado.',
    commonErrors: [
      'Ler como "oráculo de sacrifício humano". O contexto é litúrgico, não de korban humano',
    ],
    references: [
      'Salmos 118',
      'Pesachim 117a',
      'Berakhot 64a',
      'Isaías 28:16',
      'comentários clássicos (Targum, Radak, Malbim)',
    ],
  },
]

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <DashboardAccessGuard>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="flex-1">
          <div className="container py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/dashboard"
                className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Dashboard
              </Link>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-yellow-500 p-3">
                  <HelpCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">Perguntas Mais Frequentes</h1>
                  <p className="mt-2 text-lg text-gray-600">
                    Comece por aqui - conceitos fundamentais do Judaísmo
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Accordion */}
            <div className="mx-auto max-w-4xl">
              <div className="space-y-4">
                {FAQS.map((item, i) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:border-blue-200 hover:shadow-xl"
                  >
                    <button
                      onClick={() => toggle(i)}
                      className="group flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
                    >
                      <h3 className="pr-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        {item.question}
                      </h3>
                      {openIndex === i ? (
                        <ChevronUp className="h-8 w-8 flex-shrink-0 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-8 w-8 flex-shrink-0 text-gray-500" />
                      )}
                    </button>

                    {openIndex === i && (
                      <div className="space-y-4 px-6 pb-6">
                        <div className="rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4">
                          <div className="whitespace-pre-line leading-relaxed text-gray-700">
                            {item.answer}
                          </div>
                        </div>

                        {item.context && (
                          <div className="rounded-r-lg border-l-4 border-blue-200 bg-blue-50 p-4">
                            <h4 className="mb-2 font-semibold text-blue-900">
                              Contexto das Fontes:
                            </h4>
                            <div className="whitespace-pre-line text-sm leading-relaxed text-blue-800">
                              {item.context}
                            </div>
                          </div>
                        )}

                        {item.commonErrors && item.commonErrors.length > 0 && (
                          <div className="rounded-r-lg border-l-4 border-amber-200 bg-amber-50 p-4">
                            <h4 className="mb-2 font-semibold text-amber-900">Erros Comuns:</h4>
                            <ul className="space-y-1 text-sm text-amber-800">
                              {item.commonErrors.map((error, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  • {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.references && item.references.length > 0 && (
                          <div className="rounded-r-lg border-l-4 border-gray-200 bg-gray-50 p-4">
                            <h4 className="mb-2 font-semibold text-gray-900">Referências:</h4>
                            <p className="text-sm leading-relaxed text-gray-700">
                              {item.references.join('; ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Call to Action */}
              <div className="mt-12 text-center">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-3">
                      <HelpCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-2xl font-bold text-gray-800">Pronto para Aprofundar?</h3>
                  <p className="mb-6 text-gray-600">
                    Agora que você conhece os conceitos básicos, explore os tratados completos do
                    Shulchan Aruch
                  </p>
                  <Link href="/dashboard/biblioteca/shulchan-aruch">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-lg font-semibold shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl">
                      Acessar Shulchan Aruch
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardAccessGuard>
  )
}
