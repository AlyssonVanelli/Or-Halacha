/** Caminho interno vindo de ?redirect= / ?next= (nunca outro site). */
export function safeInternalPath(value: string | null | undefined): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}

/** Lê ?redirect= da URL atual (somente no navegador). */
export function redirectParam(): string | null {
  if (typeof window === 'undefined') return null
  return safeInternalPath(new URLSearchParams(window.location.search).get('redirect'))
}
