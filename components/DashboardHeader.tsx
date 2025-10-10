'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Menu, User, BookOpen, BookMarked, Star, HelpCircle, MessageCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LogoutButton } from '@/components/logout-button'
import Image from 'next/image'
import { HeaderSearchBox } from '@/components/HeaderSearchBox'

export function DashboardHeader() {
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAvatar() {
      if (user) {
        const supabase = createClient()
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        setAvatarUrl(data?.avatar_url || null)
      }
    }
    fetchAvatar()
  }, [user])

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between gap-6 px-4 md:px-6">
        <div className="flex min-w-fit items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="grid gap-6 py-6">
                <Link
                  href={user ? '/dashboard' : '/'}
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <BookOpen className="h-6 w-6" />
                  <span>Or Halacha</span>
                </Link>
                <div className="grid gap-4">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    <BookMarked className="h-4 w-4" />
                    Biblioteca
                  </Link>
                  <Link
                    href="/dashboard/favoritos"
                    className="flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    <Star className="h-4 w-4" />
                    Favoritos
                  </Link>
                  <Link
                    href="/dashboard/perfil"
                    className="flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    <User className="h-4 w-4" />
                    Perfil
                  </Link>
                  <Link
                    href="/faq"
                    className="flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    <MessageCircle className="h-4 w-4" />
                    FAQ
                  </Link>
                  <LogoutButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <Link
            href={user ? '/dashboard' : '/'}
            className="group flex items-center gap-3 whitespace-nowrap font-semibold"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg transition-all duration-300 group-hover:shadow-xl">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="hidden bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-xl text-transparent md:inline-block">
              Or Halacha
            </span>
          </Link>
        </div>
        <div className="mx-8 hidden w-full max-w-xl md:flex">
          <HeaderSearchBox />
        </div>
        <div className="flex min-w-fit items-center gap-3">
          <Link href="/dashboard/favoritos">
            <Button
              variant="ghost"
              size="icon"
              title="Favoritos"
              className="transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <Star className="h-5 w-5" />
              <span className="sr-only">Favoritos</span>
            </Button>
          </Link>
          <Link href="/suporte">
            <Button
              variant="ghost"
              size="icon"
              title="Suporte"
              className="transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Suporte</span>
            </Button>
          </Link>
          <Link href="/dashboard/perfil">
            <Button
              variant="ghost"
              size="icon"
              className="transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full border-2 border-blue-200 object-cover transition-all duration-200 hover:border-blue-500"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="sr-only">Perfil</span>
            </Button>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}

export function HeaderSimplificado() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="group flex items-center gap-3 font-semibold">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg transition-all duration-300 group-hover:shadow-xl">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-xl text-transparent">
            Or Halacha
          </span>
        </Link>
        <nav className="hidden gap-8 md:flex">
          <Link
            href="/#recursos"
            className="group relative text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-blue-600"
          >
            Recursos
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="/#planos"
            className="group relative text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-blue-600"
          >
            Planos
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>
        <div className="flex gap-3">
          <Link href="/login">
            <Button
              variant="outline"
              className="border-2 border-gray-300 shadow-sm transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md"
            >
              Entrar
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg">
              Cadastrar
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
