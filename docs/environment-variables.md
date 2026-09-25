# Variáveis de Ambiente

Variáveis usadas pelo código. Configure em `.env.local` (desenvolvimento) e no painel da Vercel (produção).

## Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Obrigatória: usada pelo webhook do Stripe e rotas de API para gravar assinaturas/compras.
# NUNCA prefixar com NEXT_PUBLIC_ (não pode ir para o navegador).
SUPABASE_SERVICE_ROLE_KEY=...
```

## Stripe

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs dos planos
NEXT_PUBLIC_STRIPE_PRICE_MENSAL=price_...
NEXT_PUBLIC_STRIPE_PRICE_MENSAL_PLUS=price_...
NEXT_PUBLIC_STRIPE_PRICE_ANUAL=price_...
NEXT_PUBLIC_STRIPE_PRICE_ANUAL_PLUS=price_...
NEXT_PUBLIC_STRIPE_PRICE_SINGLE_BOOK=price_...
```

Eventos que o endpoint `/api/webhooks/stripe` precisa receber (configurar no painel do Stripe):

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

## Aplicação

```env
# URL pública do site, sem barra no final (usada nos redirects do Stripe)
NEXT_PUBLIC_BASE_URL=https://www.or-halacha.com.br

# Token para o cron que chama POST /api/admin/sortear-siman (header Authorization: Bearer <token>)
ADMIN_SECRET_TOKEN=...
```

## Email do suporte (Nodemailer)

```env
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=Or Halacha <no-reply@seu-dominio.com>
SMTP_TO=suporte@seu-dominio.com
```

## Segurança

- **NUNCA** commite arquivos `.env` ou `.env.local`.
- `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` são segredos de servidor.
