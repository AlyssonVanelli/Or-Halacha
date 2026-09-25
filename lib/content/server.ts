import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractSubject, simanNumber, splitIntoSeifim, stripSeifNumber } from '@/lib/content/format'

// Acesso ao conteúdo do Shulchan Aruch. SOMENTE servidor: lê com service role e aplica as
// regras de acesso aqui (as tabelas de conteúdo não são legíveis pelo navegador).

export interface UserAccess {
  loggedIn: boolean
  hasSubscription: boolean
  isPlus: boolean
  divisionIds: string[]
}

export interface SeifDTO {
  number: number
  text: string
  hasExplanation: boolean
  explanation?: string
}

export interface SimanNavItem {
  id: string
  number: number
}

export interface SimanDTO {
  id: string
  number: number
  subject: string
  divisionId: string | null
  divisionTitle: string | null
  appendixType: string | null
  seifim: SeifDTO[]
  totalSeifim: number
  translationPending: boolean
  access: {
    canRead: boolean
    isPlus: boolean
    loggedIn: boolean
    isFreeToday: boolean
  }
  prev: SimanNavItem | null
  next: SimanNavItem | null
}

// Textos em que a tradução automática falhou e gravou uma recusa no lugar do conteúdo
const PENDING_TRANSLATION =
  /(n[ãa]o posso (traduzir|fornecer a tradu[çc][ãa]o)|posso oferecer um resumo)/i

export function isPendingTranslation(text: string | null | undefined) {
  return !!text && PENDING_TRANSLATION.test(text)
}

const ANONYMOUS: UserAccess = {
  loggedIn: false,
  hasSubscription: false,
  isPlus: false,
  divisionIds: [],
}

export async function getUserAccess(userId: string | null | undefined): Promise<UserAccess> {
  if (!userId) return ANONYMOUS

  const admin = createAdminClient()
  const now = new Date()

  const [{ data: sub }, { data: purchases }] = await Promise.all([
    admin
      .from('subscriptions')
      .select('status, current_period_end, explicacao_pratica')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle(),
    admin
      .from('purchased_books')
      .select('division_id, expires_at')
      .eq('user_id', userId)
      .gt('expires_at', now.toISOString()),
  ])

  const hasSubscription =
    !!sub && (!sub.current_period_end || new Date(sub.current_period_end) > now)

  return {
    loggedIn: true,
    hasSubscription,
    isPlus: hasSubscription && !!sub?.explicacao_pratica,
    divisionIds: (purchases || []).map(p => p.division_id as string),
  }
}

/** Data de hoje no fuso de São Paulo (o siman do dia vira à meia-noite do Brasil). */
export function todayBR() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

export async function getSimanDoDiaId(): Promise<string | null> {
  const { data } = await createAdminClient()
    .from('siman_do_dia')
    .select('siman_id')
    .eq('data', todayBR())
    .maybeSingle()
  return (data?.siman_id as string) || null
}

export function canReadDivision(access: UserAccess, divisionId: string | null) {
  if (access.hasSubscription) return true
  return !!divisionId && access.divisionIds.includes(divisionId)
}

// Os apêndices não têm division_id no banco, mas pertencem ao Even HaEzer
const APPENDIX_PARENT: Record<string, string> = {
  'Seder HaGet': 'Even HaEzer',
  'Seder Halitzah': 'Even HaEzer',
}

const getDivisionIdsByTitle = unstable_cache(
  async () => {
    const { data } = await createAdminClient().from('divisions').select('id, title')
    return Object.fromEntries((data || []).map(d => [d.title as string, d.id as string]))
  },
  ['division-ids-by-title'],
  { revalidate: 86400 }
)

/** Tratado ao qual o siman pertence (inclui apêndices sem division_id). */
export async function resolveDivisionId(
  divisionId: string | null,
  appendixType: string | null
): Promise<string | null> {
  if (divisionId) return divisionId
  const parent = appendixType ? APPENDIX_PARENT[appendixType] : undefined
  if (!parent) return null
  return (await getDivisionIdsByTitle())[parent] ?? null
}

async function getNeighbors(chapter: {
  division_id: string | null
  appendix_type: string | null
  position: number
}) {
  const admin = createAdminClient()
  // Navegação dentro do mesmo tratado (ou do mesmo apêndice)
  const query = () => {
    const q = admin.from('chapters').select('id, title, position')
    return chapter.division_id
      ? q.eq('division_id', chapter.division_id)
      : q.is('division_id', null).eq('appendix_type', chapter.appendix_type ?? '')
  }

  const [{ data: prev }, { data: next }] = await Promise.all([
    query().lt('position', chapter.position).order('position', { ascending: false }).limit(1),
    query().gt('position', chapter.position).order('position', { ascending: true }).limit(1),
  ])

  const toNav = (row?: { id: string; title: string; position: number } | null) =>
    row ? { id: row.id, number: simanNumber(row.title, row.position) } : null

  return { prev: toNav(prev?.[0]), next: toNav(next?.[0]) }
}

export async function getSiman(simanId: string, userId: string | null): Promise<SimanDTO | null> {
  const admin = createAdminClient()

  const { data: chapter } = await admin
    .from('chapters')
    .select('id, title, position, division_id, appendix_type')
    .eq('id', simanId)
    .maybeSingle()
  if (!chapter) return null

  const divisionId = await resolveDivisionId(chapter.division_id, chapter.appendix_type)

  const [access, freeId, { data: sections }, { data: contentRow }, divisionRes, nav] =
    await Promise.all([
      getUserAccess(userId),
      getSimanDoDiaId(),
      admin
        .from('sections')
        .select('number, content, practical_explanation')
        .eq('chapter_id', simanId)
        .order('position', { ascending: true }),
      admin.from('content').select('content').eq('chapter_id', simanId).maybeSingle(),
      divisionId
        ? admin.from('divisions').select('title').eq('id', divisionId).maybeSingle()
        : Promise.resolve({ data: null }),
      getNeighbors(chapter),
    ])

  const rawContent = (contentRow?.content as string) || ''
  const isFreeToday = freeId === simanId
  const canRead = isFreeToday || canReadDivision(access, divisionId)
  const showExplanations = canRead && access.isPlus

  let all: SeifDTO[]
  if (sections && sections.length > 0) {
    all = sections.map(s => ({
      number: s.number as number,
      text: stripSeifNumber((s.content as string) || ''),
      hasExplanation: !!(s.practical_explanation as string | null)?.trim(),
      ...(showExplanations && s.practical_explanation
        ? { explanation: stripSeifNumber(s.practical_explanation as string) }
        : {}),
    }))
  } else {
    all = splitIntoSeifim(rawContent).map(s => ({
      number: s.number,
      text: s.text,
      hasExplanation: false,
    }))
  }

  const translationPending =
    isPendingTranslation(rawContent) || all.some(s => isPendingTranslation(s.text))
  if (translationPending) all = []

  const subject = extractSubject(rawContent) || chapter.appendix_type || firstSentence(all[0]?.text)

  return {
    id: chapter.id,
    number: simanNumber(chapter.title, chapter.position),
    subject,
    divisionId,
    divisionTitle: (divisionRes.data?.title as string) || null,
    appendixType: chapter.appendix_type,
    // Sem acesso: apenas o primeiro seif como amostra
    seifim: canRead ? all : all.slice(0, 1),
    totalSeifim: all.length,
    translationPending,
    access: { canRead, isPlus: access.isPlus, loggedIn: access.loggedIn, isFreeToday },
    prev: nav.prev,
    next: nav.next,
  }
}

function firstSentence(text: string | undefined, max = 90) {
  if (!text) return ''
  const clean = text.replace(/\*+/g, '').trim()
  const sentence = clean.split(/(?<=[.?!])\s/)[0] || clean
  return sentence.length > max ? sentence.slice(0, max).replace(/\s+\S*$/, '') + '…' : sentence
}

export interface DivisionIndexItem {
  id: string
  number: number
  subject: string
}

export interface DivisionIndex {
  id: string
  title: string
  description: string | null
  bookId: string
  simanim: DivisionIndexItem[]
  appendices: Array<{ type: string; simanim: DivisionIndexItem[] }>
}

async function loadDivisionIndex(divisionId: string): Promise<DivisionIndex | null> {
  const admin = createAdminClient()

  const { data: division } = await admin
    .from('divisions')
    .select('id, title, description, book_id')
    .eq('id', divisionId)
    .maybeSingle()
  if (!division) return null

  const [{ data: chapters }, { data: appendixChapters }] = await Promise.all([
    admin
      .from('chapters')
      .select('id, title, position, appendix_type, content(content)')
      .eq('division_id', divisionId)
      .order('position', { ascending: true })
      .range(0, 1999),
    admin
      .from('chapters')
      .select('id, title, position, appendix_type')
      .eq('book_id', division.book_id)
      .is('division_id', null)
      .in(
        'appendix_type',
        Object.keys(APPENDIX_PARENT).filter(t => APPENDIX_PARENT[t] === division.title)
      )
      .order('position', { ascending: true }),
  ])

  const toItem = (ch: Record<string, unknown>): DivisionIndexItem => {
    const content = ch['content'] as { content?: string } | Array<{ content?: string }> | null
    const raw = Array.isArray(content) ? content[0]?.content : content?.content
    const pending = isPendingTranslation(raw)
    return {
      id: ch['id'] as string,
      number: simanNumber(ch['title'] as string, ch['position'] as number),
      subject: pending
        ? 'Tradução em revisão'
        : extractSubject(raw) || firstSentence(splitIntoSeifim(raw || '')[0]?.text),
    }
  }

  const main = (chapters || []).filter(ch => !ch.appendix_type).map(toItem)

  const groups = new Map<string, DivisionIndexItem[]>()
  for (const ch of appendixChapters || []) {
    const type = ch.appendix_type as string
    if (!groups.has(type)) groups.set(type, [])
    groups.get(type)!.push({
      id: ch.id as string,
      number: simanNumber(ch.title as string, ch.position as number),
      subject: type,
    })
  }

  return {
    id: division.id as string,
    title: division.title as string,
    description: (division.description as string) || null,
    bookId: division.book_id as string,
    simanim: main,
    appendices: Array.from(groups, ([type, simanim]) => ({ type, simanim })),
  }
}

// O índice (números e assuntos) é público e muda raramente: cache de 1 dia
export const getDivisionIndex = (divisionId: string) =>
  unstable_cache(() => loadDivisionIndex(divisionId), ['division-index', divisionId], {
    revalidate: 86400,
  })()

/** Textos curtos de seifim favoritados, respeitando o acesso do usuário. */
export async function getSeifPreviews(
  items: Array<{ chapterId: string; seif: number }>,
  access: UserAccess
) {
  if (items.length === 0) return new Map<string, { text: string; canRead: boolean }>()
  const admin = createAdminClient()
  const chapterIds = Array.from(new Set(items.map(i => i.chapterId)))

  const [{ data: chapters }, { data: sections }] = await Promise.all([
    admin.from('chapters').select('id, division_id, appendix_type').in('id', chapterIds),
    admin.from('sections').select('chapter_id, number, content').in('chapter_id', chapterIds),
  ])

  const divisionOf = new Map<string, string | null>()
  for (const c of chapters || []) {
    divisionOf.set(
      c.id as string,
      await resolveDivisionId(c.division_id as string | null, c.appendix_type as string | null)
    )
  }
  const result = new Map<string, { text: string; canRead: boolean }>()
  for (const s of sections || []) {
    const key = `${s.chapter_id}:${s.number}`
    if (!items.some(i => `${i.chapterId}:${i.seif}` === key)) continue
    const canRead = canReadDivision(access, divisionOf.get(s.chapter_id as string) ?? null)
    const text = stripSeifNumber((s.content as string) || '')
    result.set(key, { text: canRead ? text : firstSentence(text, 120), canRead })
  }
  return result
}
