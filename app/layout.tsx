'use client'
import type React from 'react'
import '@/app/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from '@/components/ui/toaster'
import CookieBanner from '@/app/components/CookieBanner'

// A proteção contra cópia fica só no texto do leitor (SimanReader); bloquear copiar/colar e
// clique direito no site todo atrapalhava formulários, login e acessibilidade.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Or Halachá - Shulchan Aruch em Português</title>
        <meta
          name="description"
          content="O Shulchan Aruch, código clássico da lei judaica, inteiro em português, com explicações práticas para o dia a dia. Leia grátis o siman do dia."
        />
        <meta
          name="keywords"
          content="Shulchan Aruch, Halachá, Judaísmo, Lei Judaica, Talmud, Mishná, Torá, Estudo Judaico, Religião, Tradição Judaica, Or Halachá, Português, Brasil"
        />
        <meta name="author" content="Or Halachá" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.or-halacha.com.br" />
        <meta property="og:title" content="Or Halachá - Shulchan Aruch em Português" />
        <meta
          property="og:description"
          content="Acesse o Shulchan Aruch completo em português, com explicações práticas e navegação fácil por tratados, simanim e seifim."
        />
        <meta property="og:image" content="https://www.or-halacha.com.br/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Or Halachá" />
        <meta property="og:locale" content="pt_BR" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.or-halacha.com.br" />
        <meta property="twitter:title" content="Or Halachá - Shulchan Aruch em Português" />
        <meta
          property="twitter:description"
          content="Acesse o Shulchan Aruch completo em português, com explicações práticas e navegação fácil por tratados, simanim e seifim."
        />
        <meta property="twitter:image" content="https://www.or-halacha.com.br/og-image.png" />

        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning={true}>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            {children}
            <CookieBanner />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
