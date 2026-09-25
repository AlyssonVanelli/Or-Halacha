import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { listChapterIds } from '@/lib/content/server'

const SITE_URL = 'https://www.or-halacha.com.br'

// Regerado uma vez por dia
export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/planos`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/livros`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/signup`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/suporte`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/termos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  try {
    const [{ data: divisions }, chapterIds] = await Promise.all([
      createAdminClient().from('divisions').select('id'),
      listChapterIds(),
    ])

    for (const d of divisions || []) {
      pages.push({
        url: `${SITE_URL}/tratado/${d.id}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
    for (const id of chapterIds) {
      pages.push({ url: `${SITE_URL}/siman/${id}`, changeFrequency: 'monthly', priority: 0.6 })
    }
  } catch (error) {
    // Sem acesso ao banco (ex.: build local): publica só as páginas fixas
    console.error('Sitemap: não foi possível listar tratados/simanim', error)
  }

  return pages
}
