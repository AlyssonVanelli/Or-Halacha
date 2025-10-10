import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

// Tipos para os dados retornados
export type Book = Database['public']['Tables']['books']['Row']
export type Chapter = Database['public']['Tables']['chapters']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Content = Database['public']['Tables']['content']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Favorite = Database['public']['Tables']['favorites']['Row']
export type ReadingHistory = Database['public']['Tables']['reading_history']['Row']
export type PurchasedBook = Database['public']['Tables']['purchased_books']['Row']

// Funções para interagir com o banco de dados
export const db = {
  // Livros
  books: {
    async getAll() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('books')
        .select('*, categories(*), chapters(*, content(*))')
        .eq('is_published', true)
        .order('title')

      if (error) throw error
      return data
    },

    async getBySlug(slug: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('books')
        .select('*, categories(*)')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (error) throw error
      return data
    },

    async getById(id: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('books')
        .select('*, categories(*)')
        .eq('id', id)
        .eq('is_published', true)
        .single()

      if (error) throw error
      return data
    },
  },

  // Capítulos
  chapters: {
    async getByBookId(bookId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('book_id', bookId)
        .eq('is_published', true)
        .order('position')

      if (error) throw error
      return data
    },

    async getById(id: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('chapters')
        .select('*, books(*), content(*)')
        .eq('id', id)
        .eq('is_published', true)
        .single()

      if (error) throw error
      return data
    },
  },

  // Categorias
  categories: {
    async getAll() {
      const supabase = createClient()
      const { data, error } = await supabase.from('categories').select('*').order('name')

      if (error) throw error
      return data
    },
  },

  // Favoritos
  favorites: {
    async getByUserId(userId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('favorites')
        .select('*, chapters(*, divisions(*), books(*), sections(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },

    async add(userId: string, chapterId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, chapter_id: chapterId })
        .select()

      if (error) throw error
      return data[0]
    },

    async remove(userId: string, chapterId: string) {
      const supabase = createClient()
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)

      if (error) throw error
      return true
    },

    async isFavorite(userId: string, chapterId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)
        .maybeSingle()

      if (error) throw error
      return !!data
    },
  },

  // Histórico de leitura
  readingHistory: {
    async getByUserId(userId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('reading_history')
        .select('*, chapters(*, books(*))')
        .eq('user_id', userId)
        .order('last_read_at', { ascending: false })

      if (error) throw error
      return data
    },

    async updateProgress(userId: string, chapterId: string, progress: number) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('reading_history')
        .upsert({
          user_id: userId,
          chapter_id: chapterId,
          progress,
          last_read_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error
      return data[0]
    },

    async getProgress(userId: string, chapterId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('reading_history')
        .select('progress')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)
        .maybeSingle()

      if (error) throw error
      return data?.progress || 0
    },
  },

  // Perfil do usuário
  profiles: {
    async getById(userId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      return data
    },

    async create(profile: Omit<Database['public']['Tables']['profiles']['Insert'], 'id'>) {
      const supabase = createClient()
      const { data, error } = await supabase.from('profiles').insert(profile).select()

      if (error) throw error
      return data[0]
    },

    async update(userId: string, profile: Partial<Profile>) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', userId)
        .select()

      if (error) throw error
      return data[0]
    },
  },

  // Assinaturas
  subscriptions: {
    async getByUserId(userId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .maybeSingle()

      if (error) throw error
      return data
    },

    async getActiveByUserId(userId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('current_period_end', { ascending: false })
        .maybeSingle()

      if (error) throw error
      // Verifica se a assinatura ainda está válida
      if (data && data.current_period_end && new Date(data.current_period_end) > new Date()) {
        return data
      }
      return null
    },

    async create(
      subscription: Omit<Database['public']['Tables']['subscriptions']['Insert'], 'id'>
    ) {
      const supabase = createClient()
      const { data, error } = await supabase.from('subscriptions').insert(subscription).select()

      if (error) throw error
      return data[0]
    },

    async update(id: string, subscription: Partial<Subscription>) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('subscriptions')
        .update(subscription)
        .eq('id', id)
        .select()

      if (error) throw error
      return data[0]
    },

    async delete(id: string) {
      const supabase = createClient()
      const { error } = await supabase.from('subscriptions').delete().eq('id', id)

      if (error) throw error
      return true
    },
  },

  // Livros Comprados
  purchasedBooks: {
    async getByUserId(userId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('purchased_books')
        .select('*, books(*), divisions:division_id(*)')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },

    async getByBookId(userId: string, bookId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('purchased_books')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (error) throw error
      return data
    },

    async getByUserIdAndBookId(userId: string, bookId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('purchased_books')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (error) throw error
      return data
    },

    async create(
      purchasedBook: Omit<Database['public']['Tables']['purchased_books']['Insert'], 'id'>
    ) {
      const supabase = createClient()
      const { data, error } = await supabase.from('purchased_books').insert(purchasedBook).select()

      if (error) throw error
      return data[0]
    },

    async update(id: string, purchasedBook: Partial<PurchasedBook>) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('purchased_books')
        .update(purchasedBook)
        .eq('id', id)
        .select()

      if (error) throw error
      return data[0]
    },

    async delete(id: string) {
      const supabase = createClient()
      const { error } = await supabase.from('purchased_books').delete().eq('id', id)

      if (error) throw error
      return true
    },
  },

  // Divisões
  divisions: {
    async getAll() {
      const supabase = createClient()
      const { data, error } = await supabase.from('divisions').select('*').order('position')

      if (error) throw error
      return data
    },
  },
}
