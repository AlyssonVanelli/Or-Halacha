# 📌 TODO - Or Halacha

Atualizado em 01/10/2026. Ordem = prioridade. Site no ar: https://www.or-halacha.com.br

## 🔴 1. Bloqueia o lançamento

### Pagamentos pela Hotmart (o código está pronto; falta o painel)

Passo a passo completo em `docs/hotmart.md`. Plano anual agora é à vista (R$ 799 / R$ 959, "4 meses grátis"), sem parcelamento.

- [ ] Mandar ao suporte da Hotmart as 3 perguntas de `docs/hotmart.md` (moeda do cartão/IOF, Pix nas renovações, saque para Israel)
- [ ] Mudar o país da conta de produtor para Israel (sacar o saldo antes)
- [ ] Criar o produto **Assinatura** (4 planos com os nomes exatos, Pix + cartão, sem parcelamento, garantia de 7 dias, troca de plano ativada) e o produto **Tratado avulso** (4 ofertas de R$ 29,90)
- [ ] Página de obrigado dos 2 produtos: `https://www.or-halacha.com.br/payment/success`
- [ ] Webhook 2.0 → `https://www.or-halacha.com.br/api/webhooks/hotmart` e, na Vercel, `HOTMART_HOTTOK` + os 8 links `HOTMART_CHECKOUT_*` (com `?off=`); redeploy
- [ ] Testes reais (`docs/hotmart.md`, seção 4): tratado por Pix → reembolso; assinatura mensal → cancelar renovação → reembolso
- [ ] Depois de validar: apagar as variáveis `STRIPE_*` da Vercel, desativar webhook/produtos e encerrar a conta Stripe brasileira
- [ ] **Contador em Israel (רואה חשבון):** abrir עוסק פטור ou מורשה, registrar no ביטוח לאומי
      como autônomo e confirmar:
  - se a receita do site conta como renda de fonte israelense (o trabalho é feito em Israel)
  - se você tem direito à isenção nova para olim sobre renda ativa israelense (vale para quem fez
    aliá entre 05/11/2025 e 31/12/2026; tetos de ₪600 mil em 2026 e ₪1 milhão em 2027–2028)
  - os pontos de crédito (נקודות זיכוי) de oleh e o IVA (מע"מ) sobre vendas ao exterior pela Hotmart
- [ ] Se ainda tiver pendências fiscais no Brasil (declaração de saída definitiva etc.), confirmar com
      um contador brasileiro online

### Jurídico

- [ ] Revisão dos Termos de Uso e da Política de Privacidade por advogado (os textos já foram alinhados ao que o site faz: operadores de dados, reembolso de 7 dias, exclusão de conta, uso de IA)
- [ ] Registrar a marca "Or Halachá" (INPI no Brasil e/ou רשם הסימנים em Israel — avaliar com advogado)

### Conteúdo (credibilidade com o público judeu)

- [ ] **Revisão rabínica** da tradução e principalmente das explicações práticas (geradas por IA). Ideal: nome do revisor/haskamá na página "Sobre"
- [ ] Retraduzir 6 simanim do Seder HaGet com recusa de IA no lugar do texto: **64, 67, 69, 70, 71, 72** (hoje aparecem como "Tradução em revisão")
- [ ] Decidir sobre o FAQ do dashboard: respostas polêmicas contra interpretações cristãs (Isaías 53, "véu rasgado", Mashiach) em um site que quer atrair também não judeus

### Email (senão os cadastros travam)

- [ ] **SMTP próprio no Supabase Auth** (Resend, SES, SendGrid…): o SMTP padrão do Supabase envia só alguns emails por hora — num lançamento grande, confirmação de cadastro e recuperação de senha deixam de chegar
- [ ] Supabase Auth → URL Configuration: Site URL `https://www.or-halacha.com.br` e Redirect URLs `https://www.or-halacha.com.br/**` (necessário para o novo "Esqueceu a senha?")
- [ ] Templates de email do Supabase em português (confirmação, recuperação de senha) — há um modelo em `docs/email_confirmation_template.html`
- [ ] **Criar uma caixa de email no domínio** (ex.: suporte@or-halacha.com.br — Zoho Mail grátis, Google Workspace ou encaminhamento ImprovMX) e configurar MX/SPF/DKIM. Hoje `or-halacha.com.br` não recebe email, e os antigos `orhalacha.com.br`, `orhalacha.com` e `or-halacha.com` nem existem (foram removidos do site). Depois é só preencher `SUPPORT_EMAIL` em `lib/site.ts`
- [ ] Testar o formulário de suporte em produção (SMTP\_\* na Vercel) — os pedidos só chegam por email

### Configuração e testes em produção

- [ ] Conferir na Vercel: `NEXT_PUBLIC_BASE_URL=https://www.or-halacha.com.br`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET_TOKEN`, `SMTP_*`
- [ ] Vercel → Domains: redirecionar `or-halacha.vercel.app` e `or-halacha.com.br` (sem www) para `www.or-halacha.com.br`
- [ ] Vercel → **ativar Web Analytics** (o código já está no site)
- [ ] **Google Search Console**: verificar o domínio e enviar `https://www.or-halacha.com.br/sitemap.xml` (1.874 páginas)
- [ ] Testar: cadastro → email de confirmação → login; "Esqueceu a senha?" → email → nova senha
- [ ] Testar: salvar nome no perfil, excluir uma conta de teste e o editor de conteúdo do admin
- [ ] Compartilhar o link no WhatsApp e conferir a imagem de prévia

## 🟠 2. Logo após o lançamento

- [ ] **Monitoramento de erros** (Sentry) — principalmente webhook e checkout
- [ ] Funil de conversão (cadastro → assinatura) nas métricas
- [ ] Painel administrativo mínimo: assinantes, compras, pedidos de suporte
- [ ] Email de boas-vindas e aviso antes de o tratado avulso expirar (1 mês)
- [ ] Plano Supabase adequado (o gratuito pausa por inatividade e não tem backup diário)

## 🟡 3. Produto e crescimento

- [ ] Página "Sobre": quem está por trás, fontes da tradução, revisão — gera confiança
- [ ] Depoimentos / prova social na home
- [ ] Avaliar teste grátis de 7 dias ou plano de entrada mais barato (R$ 99,90/mês é alto para o público geral)
- [ ] Busca: ordenar por relevância e filtrar por tratado
- [ ] Compartilhar um seif (link/WhatsApp) — ajuda na divulgação
- [ ] Limitar compartilhamento de conta (uma assinatura usada por várias pessoas)
- [ ] Modo escuro e auditoria de acessibilidade (Lighthouse)

## 🟢 4. Técnico

- [ ] Testes automatizados (webhook, acesso ao conteúdo, checkout)
- [ ] Rate limit real nas APIs (Vercel Firewall ou Upstash Redis)
- [ ] Explicação prática em tabela separada, restrita ao Plus também no banco
- [ ] Regenerar `lib/supabase/database.types.ts` com a CLI do Supabase
- [ ] Mesclar/fechar os PRs do Dependabot abertos no GitHub
- [ ] Cancelar a renovação pelo próprio site usando a API da Hotmart (OAuth); hoje o perfil leva à área do comprador
- [ ] Depois de validar a Hotmart: remover as colunas antigas do Stripe (`profiles.stripe_customer_id`, `purchased_books.stripe_payment_intent_id`)

## ✅ Feito

- [x] Segurança: rotas de debug/limpeza removidas, APIs com usuário da sessão, webhook com service role, RLS em pagamentos/perfis/conteúdo/dados pessoais (conferido: bloqueado para a chave pública)
- [x] Next 15.5.9 (CVEs de React Server Components)
- [x] Paywall no servidor, novo leitor, índice público, siman do dia grátis, busca sem acento, glossário
- [x] Correções de cobrança: plano anual mal configurado bloqueado, sem assinatura duplicada no upgrade/renovação, reembolso corrigido
- [x] Recuperação de senha (`/reset-password` e `/update-password`) e sessão após link de email
- [x] Siman do dia automático quando não há data cadastrada; também no dashboard do assinante
- [x] **SEO**: páginas renderizadas no servidor (antes o Google via só um spinner), título/descrição por siman e tratado, sitemap com 1.874 páginas
- [x] **Exclusão de conta** pelo perfil (LGPD) — cancela assinatura e apaga os dados
- [x] **Hotmart integrada**: checkout com e-mail e conta identificados, webhook (libera, renova, troca de plano, cancela, reembolsa, compra antes do cadastro), perfil com atalho para a área do comprador; Stripe removido do código
- [x] Anual à vista sem parcelamento (R$ 799 / R$ 959) e planos num só componente (home, /planos, dashboard)
- [x] Políticas de compra/reembolso, Privacidade, Termos, FAQ e chatbot com Hotmart, Pix + cartão e garantia de 7 dias
- [x] /livros renderizado no servidor (sem spinner)
- [x] Aviso de uso de IA na tradução/explicações (glossário e Termos)
- [x] Removidas promessas falsas do chatbot/FAQ (7 dias grátis, busca em hebraico, "explicação em cada seif")
- [x] Vercel Analytics no código
- [x] README com a arquitetura atual
- [x] Suporte: usuário sem nome já consegue enviar, pedido salvo mesmo se o email de aviso falhar, horário do Brasil, emails inexistentes removidos do site
- [x] Domínio www.or-halacha.com.br, deploy (pnpm, CI) e migrations aplicadas

## 🧹 Limpeza

- [ ] Após confirmar tudo em produção, apagar o backup `Or-Halacha-backup-2026-09-26.zip` da Área de Trabalho (contém o `.env`)
