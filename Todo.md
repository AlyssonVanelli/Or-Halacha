# 📌 TODO - Or Halacha

Atualizado em 27/09/2026. Ordem = prioridade. Site no ar: https://www.or-halacha.com.br

## 🔴 1. Bloqueia o lançamento

### Como receber (vendedor em Israel, sem residência fiscal no Brasil)

Situação: a conta Stripe atual é brasileira, no seu CPF. Conta Stripe no Brasil exige conta bancária
brasileira no mesmo CPF/CNPJ, e a receita fica atrelada ao Brasil — não combina com quem não é mais
residente fiscal. Caminho recomendado: **vender por um Merchant of Record (MoR)**.

- [ ] **Criar conta no Paddle** (recomendado): é o vendedor legal perante o cliente brasileiro,
      cuida de impostos e recibos, aceita vendedor de Israel e paga em conta bancária em Israel;
      tem "Pix Automático" para o Brasil; permite e-books/cursos/conteúdo digital por assinatura.
      Confirmar com o Paddle, na aprovação: conteúdo religioso digital por assinatura, Pix em
      assinaturas e cobrança em BRL
- [ ] Alternativa se o Paddle recusar: Lemon Squeezy (MoR; sem Pix hoje) ou Hotmart (forte em Pix e
      boleto no Brasil; confirmar regras para produtor estrangeiro)
- [ ] **Depois de aprovado no MoR: migrar checkout, webhook, portal e reembolso no código** (técnico —
      o Claude faz; 2 a 3 dias de trabalho + testes)
- [ ] Encerrar/desativar a conta Stripe brasileira depois da migração
- [ ] **Contador em Israel (רואה חשבון):** abrir עוסק פטור ou מורשה, registrar no ביטוח לאומי
      como autônomo e confirmar:
  - se a receita do site conta como renda de fonte israelense (o trabalho é feito em Israel)
  - se você tem direito à isenção nova para olim sobre renda ativa israelense (vale para quem fez
    aliá entre 05/11/2025 e 31/12/2026; tetos de ₪600 mil em 2026 e ₪1 milhão em 2027–2028)
  - os pontos de crédito (נקודות זיכוי) de oleh e o IVA (מע"מ) sobre vendas ao exterior via MoR
- [ ] Se ainda tiver pendências fiscais no Brasil (declaração de saída definitiva etc.), confirmar com
      um contador brasileiro online

### Cobrança (enquanto o Stripe estiver em uso)

- [ ] **Preços anuais estão como cobrança MENSAL**: "Anual Básico" (R$ 958,80) e "Anual Plus" (R$ 1.078,80) cobrariam todo mês. Corrigir para intervalo **anual** (até corrigir, o site recusa a venda anual)
- [ ] Customer Portal: adicionar os 4 planos em "Troca de plano" (hoje a lista está vazia)
- [ ] Webhook de produção com os eventos: `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- [ ] Corrigir nome do produto "Shuchan Aruch Anual Plus" → "Shulchan Aruch Anual Plus"

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
- [ ] **Escolher um único email de suporte** e criar a caixa no domínio (MX/SPF/DKIM de or-halacha.com.br). Hoje o site mostra 3 domínios diferentes: `suporte@orhalacha.com.br` (rodapé), `suporte@orhalacha.com` (/suporte), `suporte@or-halacha.com` (políticas), além de `termos@` e `privacidade@` — depois de escolher, o Claude troca em todo o site
- [ ] Testar o formulário de suporte em produção (SMTP\_\* na Vercel) — os pedidos só chegam por email

### Configuração e testes em produção

- [ ] Conferir na Vercel: `NEXT_PUBLIC_BASE_URL=https://www.or-halacha.com.br`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET_TOKEN`, `SMTP_*`
- [ ] Vercel → Domains: redirecionar `or-halacha.vercel.app` e `or-halacha.com.br` (sem www) para `www.or-halacha.com.br`
- [ ] Vercel → **ativar Web Analytics** (o código já está no site)
- [ ] **Google Search Console**: verificar o domínio e enviar `https://www.or-halacha.com.br/sitemap.xml` (1.874 páginas)
- [ ] Testar com cartão real (valor baixo, depois reembolsar): assinatura mensal, Plus, tratado avulso, cancelamento, reembolso
- [ ] Testar: cadastro → email de confirmação → login; "Esqueceu a senha?" → email → nova senha
- [ ] Testar: salvar nome no perfil, excluir uma conta de teste e o editor de conteúdo do admin
- [ ] Compartilhar o link no WhatsApp e conferir a imagem de prévia

## 🟠 2. Logo após o lançamento

- [ ] **Monitoramento de erros** (Sentry) — principalmente webhook e checkout
- [ ] Funil de conversão (cadastro → assinatura) nas métricas
- [ ] Cron / curadoria do `siman_do_dia` (as datas cadastradas acabaram em 25/09/2026; o site escolhe um siman automático por dia)
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

## ✅ Feito

- [x] Segurança: rotas de debug/limpeza removidas, APIs com usuário da sessão, webhook com service role, RLS em pagamentos/perfis/conteúdo/dados pessoais (conferido: bloqueado para a chave pública)
- [x] Next 15.5.9 (CVEs de React Server Components)
- [x] Paywall no servidor, novo leitor, índice público, siman do dia grátis, busca sem acento, glossário
- [x] Correções de cobrança: plano anual mal configurado bloqueado, sem assinatura duplicada no upgrade/renovação, reembolso corrigido
- [x] Recuperação de senha (`/reset-password` e `/update-password`) e sessão após link de email
- [x] Siman do dia automático quando não há data cadastrada; também no dashboard do assinante
- [x] **SEO**: páginas renderizadas no servidor (antes o Google via só um spinner), título/descrição por siman e tratado, sitemap com 1.874 páginas
- [x] **Exclusão de conta** pelo perfil (LGPD) — cancela assinatura e apaga os dados
- [x] Políticas alinhadas ao site: sem Pix, reembolso integral em 7 dias pelo perfil, preços do Plus, operadores de dados na Privacidade
- [x] Aviso de uso de IA na tradução/explicações (glossário e Termos)
- [x] Removidas promessas falsas do chatbot/FAQ (Pix, 7 dias grátis, busca em hebraico, "explicação em cada seif")
- [x] Vercel Analytics no código
- [x] README com a arquitetura atual
- [x] Domínio www.or-halacha.com.br, deploy (pnpm, CI) e migrations aplicadas

## 🧹 Limpeza

- [ ] Após confirmar tudo em produção, apagar o backup `Or-Halacha-backup-2026-09-26.zip` da Área de Trabalho (contém o `.env`)
