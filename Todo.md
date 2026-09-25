# 📌 TODO - Or Halacha

Atualizado em 27/09/2026. Ordem = prioridade. Site no ar: https://www.or-halacha.com.br

## 🔴 1. Bloqueia o lançamento

### Cobrança (Stripe — painel de teste E de produção)

- [ ] **Preços anuais estão como cobrança MENSAL**: "Anual Básico" (R$ 958,80) e "Anual Plus" (R$ 1.078,80) cobrariam todo mês. Criar preços com intervalo **anual** e atualizar `NEXT_PUBLIC_STRIPE_PRICE_ANUAL` / `NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS` na Vercel. (Até corrigir, o site recusa a venda anual.)
- [ ] Conta Stripe em **modo produção** ativada, com dados da empresa e descrição na fatura do cartão ("OR HALACHA")
- [ ] Customer Portal: adicionar os 4 planos em "Troca de plano" (hoje a lista está vazia)
- [ ] Webhook de produção com os eventos: `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- [ ] Recibos do Stripe em português e com o logo
- [ ] Corrigir nome do produto "Shuchan Aruch Anual Plus" → "Shulchan Aruch Anual Plus"

### Fiscal / jurídico (Brasil)

- [ ] **CNPJ e emissão de nota fiscal** para cada venda — o Stripe NÃO emite NF-e/NFS-e brasileira (integrar eNotas/NFE.io ou emitir manualmente)
- [ ] **Termos de Uso e Política de Privacidade** revisados por advogado e coerentes com o site real: Stripe e Supabase como operadores de dados, prazo de reembolso de 7 dias, cookies, uso de IA na tradução
- [ ] **Exclusão de conta** (direito do titular — LGPD art. 18): hoje não existe; no mínimo um botão "excluir minha conta" ou fluxo pelo suporte com prazo
- [ ] Informar na página e nos termos que a tradução/explicações foram produzidas com auxílio de IA (transparência — CDC)
- [ ] Registrar a marca "Or Halachá" no INPI

### Conteúdo (credibilidade com o público judeu)

- [ ] **Revisão rabínica** da tradução e principalmente das explicações práticas (geradas por IA; erros halachicos derrubam a reputação no lançamento). Ideal: nome do revisor/haskamá na página
- [ ] Retraduzir 6 simanim do Seder HaGet com recusa de IA no lugar do texto: **64, 67, 69, 70, 71, 72** (hoje aparecem como "Tradução em revisão")
- [ ] Revisar o FAQ e o chatbot da home (conteúdo religioso, ex.: perguntas sobre Mashiach)
- [ ] Deixar claro no Plus que há explicação em ~60% dos seifim (11.290 de 18.857), não em todos

### Email (senão os cadastros travam)

- [ ] **SMTP próprio no Supabase Auth** (Resend, SES, SendGrid…): o SMTP padrão do Supabase envia só alguns emails por hora — num lançamento grande, confirmação de cadastro e recuperação de senha deixam de chegar
- [ ] Supabase Auth → URL Configuration: Site URL `https://www.or-halacha.com.br` e Redirect URLs `https://www.or-halacha.com.br/**`
- [ ] Templates de email do Supabase em português (confirmação, recuperação de senha) — há um modelo em `docs/email_confirmation_template.html`
- [ ] Email do domínio funcionando (MX/SPF/DKIM de or-halacha.com.br) e **um único endereço de suporte** — hoje há 3 domínios diferentes: `suporte@orhalacha.com.br` (rodapé), `suporte@orhalacha.com` (/suporte), `suporte@or-halacha.com` (políticas), além de `termos@` e `privacidade@`
- [ ] Testar o formulário de suporte em produção (SMTP\_\* na Vercel) — os pedidos só chegam por email

### Configuração e testes em produção

- [ ] Conferir na Vercel: `NEXT_PUBLIC_BASE_URL=https://www.or-halacha.com.br`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET_TOKEN`, `SMTP_*`
- [ ] Redirecionar `or-halacha.vercel.app` e `or-halacha.com.br` (sem www) para `www.or-halacha.com.br`
- [ ] Testar com cartão real (valor baixo, depois reembolsar): assinatura mensal, Plus, tratado avulso (depende do webhook), cancelamento, reembolso
- [ ] Testar: cadastro → email de confirmação → login; "Esqueceu a senha?" → email → nova senha
- [ ] Testar: salvar nome no perfil (nova RLS de `profiles`) e editor de conteúdo do admin (`profiles.is_admin`)
- [ ] Compartilhar o link no WhatsApp e conferir a imagem de prévia

## 🟠 2. Logo após o lançamento

- [ ] **Métricas**: Vercel Analytics (ou Plausible) + funil cadastro → assinatura; sem isso não dá para saber se o lançamento funcionou
- [ ] **Monitoramento de erros** (Sentry) — principalmente webhook do Stripe e checkout
- [ ] **SEO das páginas de siman**: hoje o texto é carregado no navegador e todas as páginas têm o mesmo título; renderizar no servidor com título/descrição por siman ("Siman 1 — Lei do despertar matutino") e incluir os simanim no sitemap
- [ ] **Pix** (e boleto) para tratado avulso — cartão é a única opção hoje
- [ ] Cron para o `siman_do_dia` (as datas cadastradas acabaram em 25/09/2026; hoje o site escolhe um siman automático por dia, mas sem curadoria)
- [ ] Painel administrativo mínimo: assinantes, compras, pedidos de suporte (hoje só pelo Supabase/Stripe)
- [ ] Email de boas-vindas e aviso antes de o tratado avulso expirar (1 mês)
- [ ] Plano Supabase adequado (o gratuito pausa por inatividade e não tem backup diário)

## 🟡 3. Produto e crescimento

- [ ] Página "Sobre": quem está por trás, fontes da tradução, revisão — gera confiança
- [ ] Depoimentos / prova social na home
- [ ] Avaliar teste grátis de 7 dias ou plano de entrada mais barato (R$ 99,90/mês é alto para o público geral)
- [ ] Revisar textos das políticas (compra, reembolso, cópia) com o que o site realmente faz
- [ ] Mostrar o siman do dia também no dashboard do assinante
- [ ] Busca: ordenar por relevância e filtrar por tratado
- [ ] Compartilhar um seif (link/WhatsApp) — ajuda na divulgação
- [ ] Limitar compartilhamento de conta (uma assinatura usada por várias pessoas)
- [ ] Modo escuro e auditoria de acessibilidade (Lighthouse)

## 🟢 4. Técnico

- [ ] Testes automatizados (webhook, acesso ao conteúdo, checkout) — os antigos não rodavam e foram removidos
- [ ] Rate limit real nas APIs (Vercel Firewall ou Upstash Redis)
- [ ] Explicação prática em tabela separada, restrita ao Plus também no banco
- [ ] Regenerar `lib/supabase/database.types.ts` com a CLI do Supabase
- [ ] Atualizar `README.md` com a arquitetura nova (`/siman/[id]`, `/tratado/[id]`, `/api/conteudo/*`)
- [ ] Mesclar/fechar os PRs do Dependabot abertos no GitHub

## ✅ Feito

- [x] Segurança: rotas de debug/limpeza removidas, APIs com usuário da sessão, webhook com service role, RLS em pagamentos/perfis/conteúdo/dados pessoais (conferido: bloqueado para a chave pública)
- [x] Next 15.5.9 (CVEs de React Server Components)
- [x] Paywall no servidor, novo leitor, índice público, siman do dia grátis, busca sem acento, glossário
- [x] Correções de cobrança: plano anual mal configurado bloqueado, sem assinatura duplicada no upgrade/renovação, reembolso corrigido
- [x] Recuperação de senha (`/reset-password` e `/update-password`) e sessão após link de email
- [x] Siman do dia com escolha automática quando não há data cadastrada
- [x] Domínio www.or-halacha.com.br no código, SEO básico (robots, sitemap, imagem de prévia)
- [x] Deploy (pnpm, CI) e migrations aplicadas

## 🧹 Limpeza

- [ ] Após confirmar tudo em produção, apagar o backup `Or-Halacha-backup-2026-09-26.zip` da Área de Trabalho (contém o `.env`)
