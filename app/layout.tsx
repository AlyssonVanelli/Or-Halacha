import type React from 'react'
import type { Metadata, Viewport } from 'next'
import '@/app/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/next'
import CookieBanner from '@/app/components/CookieBanner'

const SITE_URL = 'https://www.or-halacha.com.br'
const DESCRIPTION =
  'O Shulchan Aruch, código clássico da lei judaica, inteiro em português, com explicações práticas para o dia a dia. Leia grátis o siman do dia.'

// Metadados padrão; páginas como /siman/[id] e /tratado/[id] sobrescrevem título e descrição.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Or Halachá - Shulchan Aruch em Português',
    template: '%s | Or Halachá',
  },
  description: DESCRIPTION,
  keywords: [
    'Shulchan Aruch',
    'Halachá',
    'lei judaica',
    'judaísmo',
    'Orach Chayim',
    "Yoreh De'ah",
    'Even HaEzer',
    'Choshen Mishpat',
    'português',
  ],
  authors: [{ name: 'Or Halachá' }],
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Or Halachá',
    locale: 'pt_BR',
    title: 'Or Halachá - Shulchan Aruch em Português',
    description: DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Or Halachá - Shulchan Aruch em Português',
    description: DESCRIPTION,
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning={true}>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            {children}
            <CookieBanner />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
