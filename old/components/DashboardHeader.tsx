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
    <header className="sticky top-0 z-10 border-b bg-white dark:bg-slate-950">
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
            className="flex items-center gap-2 whitespace-nowrap font-semibold"
          >
            <BookOpen className="h-6 w-6" />
            <span className="hidden md:inline-block">Or Halacha</span>
          </Link>
        </div>
        <div className="mx-8 hidden w-full max-w-xl md:flex">
          <HeaderSearchBox />
        </div>
        <div className="flex min-w-fit items-center gap-4">
          <Link href="/dashboard/favoritos">
            <Button variant="ghost" size="icon" title="Favoritos">
              <Star className="h-5 w-5" />
              <span className="sr-only">Favoritos</span>
            </Button>
          </Link>
          <Link href="/faq">
            <Button variant="ghost" size="icon" title="FAQ">
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">FAQ</span>
            </Button>
          </Link>
          <Link href="/suporte">
            <Button variant="ghost" size="icon" title="Suporte">
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Suporte</span>
            </Button>
          </Link>
          <Link href="/dashboard/perfil">
            <Button variant="ghost" size="icon">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                  width={32}
                  height={32}
                />
              ) : (
                <User className="h-5 w-5" />
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
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-6 w-6" />
          <span>Or Halacha</span>
        </Link>
        <nav className="hidden gap-6 md:flex">
          <Link
            href="/#recursos"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Recursos
          </Link>
          <Link href="/#planos" className="text-sm font-medium underline-offset-4 hover:underline">
            Planos
          </Link>
          <Link href="/sobre" className="text-sm font-medium underline-offset-4 hover:underline">
            Sobre
          </Link>
          <Link href="/faq" className="text-sm font-medium underline-offset-4 hover:underline">
            FAQ
          </Link>
        </nav>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline">Entrar</Button>
          </Link>
          <Link href="/signup">
            <Button>Cadastrar</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
