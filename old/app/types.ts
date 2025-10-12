export interface Division {
  id: string
  title: string
  slug?: string
  position: number
  description?: string | null
  book_id?: string
}

export interface Chapter {
  id: number
  title: string
  slug: string
  position: number
  content?: string
  appendix_type?: string | null
}

export interface Book {
  id: string
  title: string
  description: string | null
  author: string | null
  divisions: Division[]
  category?: string
}

export interface Category {
  id: string
  name: string
}

export interface PageProps {
  params: Promise<{
    livroId?: string
    divisaoId?: string
    simanId?: string
  }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export interface SearchDialogProps {
  openFromFavoritos?: boolean
}
