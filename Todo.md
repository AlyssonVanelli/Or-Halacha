# 📌 TODO - Or Halacha

Atualizado em 26/09/2026. Ordem = prioridade.

## 🔴 Antes do lançamento (bloqueia)

### Stripe (painel — teste E produção)

- [ ] **Preços anuais estão como cobrança MENSAL**: "Anual Básico" (R$ 958,80) e "Anual Plus" (R$ 1.078,80) cobram todo mês. Criar preços com intervalo **anual** e atualizar `NEXT_PUBLIC_STRIPE_PRICE_ANUAL` / `NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS` na Vercel. (Até corrigir, o site recusa a venda dos planos anuais.)
- [ ] Customer Portal: adicionar os 4 planos em "Troca de plano" (hoje a lista está vazia, "Mudar plano" não oferece opções)
- [ ] Webhook de produção: confirmar os eventos `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- [ ] Corrigir nome do produto "Shuchan Aruch Anual Plus" → "Shulchan Aruch Anual Plus"

### Deploy

- [ ] Conferir na Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_BASE_URL`, `ADMIN_SECRET_TOKEN` (ver `docs/environment-variables.md`)
- [ ] Definir gerenciador de pacotes (npm ou pnpm) e apagar o lockfile que sobrar (`package-lock.json` / `pnpm-lock.yaml`)
- [ ] Deploy na Vercel
- [ ] **Logo após o deploy**, aplicar no Supabase (nesta ordem):
  - [ ] `supabase/migrations/20260926000000_harden_rls_pagamentos.sql`
  - [ ] `supabase/migrations/20260926010000_protect_content_and_pii.sql`
  - [x] `supabase/migrations/20260927000000_busca_sem_acento.sql` (já aplicada)
- [ ] Depois das migrations, conferir que o conteúdo NÃO é mais legível pela chave anon (content, sections, support_requests)

### Testes em produção (após deploy)

- [ ] Compra de tratado avulso (só funciona com webhook — não testável em localhost)
- [ ] Assinatura mensal + webhook gravando a assinatura
- [ ] Explicação prática com conta Plus
- [ ] Salvar nome no perfil e trocar senha (dependem da nova RLS de `profiles`)
- [ ] Editor de conteúdo do admin (`/dashboard/books/...`) continua salvando (usa `profiles.is_admin`)
- [ ] Compartilhar link no WhatsApp e conferir a imagem de prévia

## 🟠 Conteúdo

- [ ] Retraduzir 6 simanim do Seder HaGet com recusa de IA no lugar do texto: **64, 67, 69, 70, 71, 72** (hoje aparecem como "Tradução em revisão")
- [ ] Revisar se há outros textos com problemas de tradução (a busca por "não posso traduzir" encontrou só esses)
- [ ] Cadastrar `siman_do_dia` para os próximos meses (a tabela tem 497 datas; confirmar até quando)

## 🟡 Produto / marca

- [ ] Registrar domínio
- [ ] Registrar patente/marca
- [ ] **Unificar email do suporte** — hoje há 3 domínios: `suporte@orhalacha.com.br` (rodapé), `suporte@orhalacha.com` (/suporte), `suporte@or-halacha.com` (políticas). Também `termos@` e `privacidade@`
- [ ] Após o domínio: trocar `or-halacha.vercel.app` nas meta tags (`app/layout.tsx`), `public/robots.txt`, `public/sitemap.xml` e `NEXT_PUBLIC_BASE_URL`
- [ ] Botão de upgrade: hoje "Mudar plano" abre o portal do Stripe (depende do item do Customer Portal acima)
- [ ] Revisar textos das políticas (compra, reembolso, cópia) com o que o site realmente faz (ex.: reembolso em 7 dias, sem "suporte prioritário")

## 🟢 Melhorias (pós-lançamento)

- [ ] Testes automatizados (os antigos não rodavam e foram removidos) — ao menos para webhook, acesso ao conteúdo e checkout
- [ ] Rate limit real nas APIs (Vercel Firewall ou Upstash Redis)
- [ ] Mostrar o siman do dia também no dashboard do assinante
- [ ] Explicação prática restrita ao Plus também no banco (hoje o servidor controla; a coluna fica em `sections`)
- [ ] Busca: ordenar por relevância e filtrar por tratado na interface
- [ ] Regenerar `lib/supabase/database.types.ts` com a CLI do Supabase (os tipos estão desatualizados)
- [ ] Atualizar `README.md` com a arquitetura nova (leitor `/siman/[id]`, índice `/tratado/[id]`, APIs `/api/conteudo/*`)

## 🧹 Limpeza

- [ ] Apagar `.claude/launch.json` (usado só no teste local)
- [ ] Após confirmar tudo em produção, apagar o backup `Or-Halacha-backup-2026-09-26.zip` da Área de Trabalho (contém o `.env`)
