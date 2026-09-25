import Link from 'next/link'
import { SUPPORT_EMAIL, SUPPORT_PAGE } from '@/lib/site'

// Canal de contato por escrito: e-mail (se configurado) ou o formulário de suporte
export function SupportContact({ className = 'underline' }: { className?: string }) {
  return SUPPORT_EMAIL ? (
    <a href={`mailto:${SUPPORT_EMAIL}`} className={className}>
      {SUPPORT_EMAIL}
    </a>
  ) : (
    <Link href={SUPPORT_PAGE} className={className}>
      formulário de suporte
    </Link>
  )
}
