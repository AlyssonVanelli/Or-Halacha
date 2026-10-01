// Os 4 tratados (ids fixos do banco). `code` é usado nas variáveis de checkout da Hotmart
// (HOTMART_CHECKOUT_TRATADO_OC etc.).
export const TREATISES = [
  { id: '210e3fc7-86ac-4c4c-9827-1efc63e8d87d', code: 'OC', title: 'Orach Chayim' },
  { id: '58150765-f472-4a53-b365-97bfc75e9029', code: 'YD', title: "Yoreh De'ah" },
  { id: 'b3ca1ec0-874e-4738-bef7-cbb91e4f547d', code: 'EH', title: 'Even HaEzer' },
  { id: 'f6fba778-0aa1-4df1-a496-cebb967d1fe3', code: 'CM', title: 'Choshen Mishpat' },
] as const

export type Treatise = (typeof TREATISES)[number]

export function treatiseById(id: string | null | undefined): Treatise | undefined {
  return TREATISES.find(t => t.id === id)
}

// Descrição curta de cada tratado para quem está começando (servidor e cliente)
export const DIVISION_BLURBS: Record<string, string> = {
  'Orach Chayim':
    'O dia a dia judaico: despertar, rezas, bênçãos, tefilin, Shabat e festas do calendário.',
  "Yoreh De'ah":
    'Alimentação kasher, abate, mistura de carne e leite, pureza familiar, luto, caridade e estudo.',
  'Even HaEzer': 'Casamento, ketubá, obrigações entre marido e mulher e divórcio (guet).',
  'Choshen Mishpat':
    'Direito civil: tribunais, testemunhas, empréstimos, compras e vendas, danos e heranças.',
}
