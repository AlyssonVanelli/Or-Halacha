# Or Halachá

O Shulchan Aruch em português — https://www.or-halacha.com.br

Leitura por tratado e siman, siman do dia gratuito, busca sem acento, favoritos e, no plano Plus,
explicações práticas por seif.

## Tecnologias

- [Next.js 15](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com/) — Postgres, Auth e Storage
- [Hotmart](https://hotmart.com/) — pagamentos (Pix e cartão), assinaturas, tratado avulso e reembolsos
- [Vercel](https://vercel.com/) — hospedagem e Web Analytics
- pnpm (gerenciador de pacotes usado na Vercel e no CI)

## Rodando localmente

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Variáveis de ambiente: veja [docs/environment-variables.md](docs/environment-variables.md).
Sem as variáveis da Hotmart o site funciona normalmente; só os botões de pagamento mostram
"Pagamentos em configuração".

```bash
pnpm type-check   # TypeScript
pnpm lint         # ESLint
pnpm build        # build de produção
```

O hook de pre-commit (husky) roda `lint-staged` (ESLint + Prettier nos arquivos alterados).
Mensagens de commit seguem o [Conventional Commits](https://www.conventionalcommits.org/).

## Arquitetura

### Conteúdo e controle de acesso

O texto do Shulchan Aruch **nunca é lido direto pelo navegador**. As tabelas `content` e
`sections` só são acessíveis pelo servidor (service role); as rotas aplicam as regras de acesso:

| Quem                       | O que lê                                                                  |
| -------------------------- | ------------------------------------------------------------------------- |
| Visitante / conta gratuita | índice de todos os tratados, 1º seif de cada siman, siman do dia completo |
| Tratado avulso (1 mês)     | tudo daquele tratado                                                      |
| Assinatura Básica          | todos os tratados                                                         |
| Assinatura Plus            | + explicações práticas                                                    |

- `lib/content/server.ts` — acesso do usuário, siman, índice do tratado, siman do dia
- `lib/content/format.ts` — assunto do siman, divisão em seifim, busca sem acento
- `app/api/conteudo/siman/[simanId]` e `app/api/conteudo/divisao/[divisionId]`
- `app/api/search` — busca via função `search_sections` (unaccent) no banco
- `app/api/explicacao-pratica`, `app/api/favoritos`, `app/api/siman-do-dia`

### Páginas principais

- `/` — landing com siman do dia
- `/siman/[simanId]` — leitor (renderizado no servidor, com título/descrição por siman)
- `/tratado/[divisionId]` — índice do tratado com busca por número/assunto
- `/dashboard` — área logada (biblioteca, favoritos, perfil)
- `/search`, `/planos`, `/livros`, `/reset-password`, `/update-password`
- `app/sitemap.ts` — sitemap com todos os tratados e simanim

### Pagamentos (Hotmart)

Guia completo (painel, variáveis, testes e operação): [docs/hotmart.md](docs/hotmart.md).

- Preços exibidos: `lib/plans.ts` (anual à vista, sem parcelamento) e `components/PlanCards.tsx`
- Checkout: `/checkout/<plano ou id do tratado>` (`app/checkout/[item]/route.ts`) → link da
  Hotmart com e-mail e id da conta (`lib/hotmart.ts`)
- Webhook: `app/api/webhooks/hotmart` → `lib/hotmart-events.ts` (libera, renova, cancela,
  reembolsa; eventos em `payment_events`)
- Cancelar, trocar plano/cartão e reembolso: na área do comprador da Hotmart; o perfil mostra o
  atalho (`components/BillingSection.tsx`)

### Banco de dados

Migrations em `supabase/migrations/` (aplicar em ordem). As de 2026-09 definem o RLS atual:
usuários só leem os próprios dados; conteúdo e dados pessoais só pelo servidor.

### Autenticação

- `contexts/auth-context.tsx` — usuário atual no cliente (esperar `loading` antes de redirecionar)
- `lib/api-auth.ts` — `getAuthenticatedUser()` nas rotas; nunca confiar em `userId` do corpo
- `app/auth/callback` — links de e-mail (confirmação e recuperação de senha)
- `app/api/account/delete` — exclusão de conta pelo titular (LGPD)

## Deploy

Push na branch `main` → deploy automático na Vercel. O GitHub Actions (`.github/workflows/ci.yml`)
roda type-check, lint e build.

## Pendências

Veja [Todo.md](Todo.md).

## Licença

Uso exclusivo — veja [LICENCA_DE_USO_EXCLUSIVO.md](LICENCA_DE_USO_EXCLUSIVO.md).
