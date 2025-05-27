'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { PropsWithChildren } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function ThemeProvider({ children, ...props }: PropsWithChildren<{ defaultTheme?: Theme }>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
