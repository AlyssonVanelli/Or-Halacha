import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export function DashboardFooter() {
  return (
    <footer className="border-t bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-6 w-6" />
              <span>Or Halacha</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Acesso completo à Halachá traduzida e explicada.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Links Úteis</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:underline">
                  Biblioteca
                </Link>
              </li>
              <li>
                <Link href="/dashboard/favoritos" className="text-muted-foreground hover:underline">
                  Favoritos
                </Link>
              </li>
              <li>
                <Link href="/suporte" className="text-muted-foreground hover:underline">
                  Suporte
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Contato</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/suporte" className="text-muted-foreground hover:underline">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <a
                  href="mailto:suporte@orhalacha.com.br"
                  className="text-muted-foreground hover:underline"
                >
                  suporte@orhalacha.com.br
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/972555196370"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:underline"
                >
                  WhatsApp Suporte
                </a>
              </li>
              <li>
                <Link href="/termos" className="text-muted-foreground hover:underline">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-muted-foreground hover:underline">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/politica-compra" className="text-muted-foreground hover:underline">
                  Política de Compra
                </Link>
              </li>
              <li>
                <Link href="/politica-reembolso" className="text-muted-foreground hover:underline">
                  Política de Reembolso
                </Link>
              </li>
              <li>
                <Link href="/politica-copia" className="text-muted-foreground hover:underline">
                  Política de Cópia
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Or Halacha. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
