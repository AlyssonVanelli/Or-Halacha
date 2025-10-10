import { Metadata } from 'next'

export const defaultMetadata: Metadata = {
  title: {
    default: 'Or Halachá - Shulchan Aruch em Português',
    template: '%s | Or Halachá',
  },
  description:
    'Acesse o Shulchan Aruch completo em português, com explicações práticas e navegação fácil por tratados, simanim e seifim. Estude, pesquise e aprofunde seu conhecimento em Halachá clássica.',
  keywords: [
    'Shulchan Aruch',
    'Halachá',
    'Judaísmo',
    'Lei Judaica',
    'Talmud',
    'Mishná',
    'Torá',
    'Estudo Judaico',
    'Religião',
    'Tradição Judaica',
    'Or Halachá',
    'Português',
    'Brasil',
  ],
  authors: [{ name: 'Or Halachá' }],
  creator: 'Or Halachá',
  publisher: 'Or Halachá',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://or-halacha.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://or-halacha.vercel.app',
    title: 'Or Halachá - Shulchan Aruch em Português',
    description:
      'Acesse o Shulchan Aruch completo em português, com explicações práticas e navegação fácil por tratados, simanim e seifim.',
    siteName: 'Or Halachá',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Or Halachá - Shulchan Aruch em Português',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Or Halachá - Shulchan Aruch em Português',
    description:
      'Acesse o Shulchan Aruch completo em português, com explicações práticas e navegação fácil por tratados, simanim e seifim.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Substitua pelo código real
  },
}

export const homeMetadata: Metadata = {
  title: 'Or Halachá - Shulchan Aruch em Português',
  description:
    'Acesse o Shulchan Aruch completo em português, com explicações práticas e navegação fácil por tratados, simanim e seifim. Estude, pesquise e aprofunde seu conhecimento em Halachá clássica.',
  openGraph: {
    title: 'Or Halachá - Shulchan Aruch em Português',
    description:
      'Acesse o Shulchan Aruch completo em português, com explicações práticas e navegação fácil por tratados, simanim e seifim.',
    type: 'website',
    url: 'https://or-halacha.vercel.app',
  },
}

export const dashboardMetadata: Metadata = {
  title: 'Dashboard - Biblioteca Haláchica',
  description:
    'Acesse sua biblioteca pessoal de Halachá. Navegue pelos tratados, simanim e seifim do Shulchan Aruch em português.',
  openGraph: {
    title: 'Dashboard - Biblioteca Haláchica',
    description:
      'Acesse sua biblioteca pessoal de Halachá. Navegue pelos tratados, simanim e seifim do Shulchan Aruch em português.',
    type: 'website',
  },
}

export const sobreMetadata: Metadata = {
  title: 'Sobre o Or Halachá',
  description:
    'Conheça a missão do Or Halachá: democratizar o acesso ao Shulchan Aruch em português e facilitar o estudo da Halachá clássica.',
  openGraph: {
    title: 'Sobre o Or Halachá',
    description:
      'Conheça a missão do Or Halachá: democratizar o acesso ao Shulchan Aruch em português e facilitar o estudo da Halachá clássica.',
    type: 'website',
  },
}

export const planosMetadata: Metadata = {
  title: 'Planos e Assinaturas',
  description:
    'Escolha o plano ideal para acessar o Shulchan Aruch completo em português. Planos flexíveis para estudantes, rabinos e estudiosos.',
  openGraph: {
    title: 'Planos e Assinaturas - Or Halachá',
    description:
      'Escolha o plano ideal para acessar o Shulchan Aruch completo em português. Planos flexíveis para estudantes, rabinos e estudiosos.',
    type: 'website',
  },
}
