# Variáveis de Ambiente

Variáveis usadas pelo código. Configure em `.env.local` (desenvolvimento) e no painel da Vercel (produção).

## Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Obrigatória: usada pelo webhook da Hotmart e pelas rotas de API para ler o conteúdo e
# gravar assinaturas/compras. NUNCA prefixar com NEXT_PUBLIC_ (não pode ir para o navegador).
SUPABASE_SERVICE_ROLE_KEY=...
```

## Hotmart (pagamentos)

Passo a passo em [`docs/hotmart.md`](./hotmart.md).

```env
# Token da conta (Ferramentas → Webhook). Valida o header X-HOTMART-HOTTOK.
HOTMART_HOTTOK=...

# Links de checkout de cada plano/oferta, copiados do painel, COM o ?off=...
HOTMART_CHECKOUT_MENSAL=https://pay.hotmart.com/XXXXXXXX?off=aaaaaaaa
HOTMART_CHECKOUT_MENSAL_PLUS=https://pay.hotmart.com/XXXXXXXX?off=bbbbbbbb
HOTMART_CHECKOUT_ANUAL=https://pay.hotmart.com/XXXXXXXX?off=cccccccc
HOTMART_CHECKOUT_ANUAL_PLUS=https://pay.hotmart.com/XXXXXXXX?off=dddddddd

# Tratado avulso (1 oferta por tratado)
HOTMART_CHECKOUT_TRATADO_OC=https://pay.hotmart.com/YYYYYYYY?off=...   # Orach Chayim
HOTMART_CHECKOUT_TRATADO_YD=https://pay.hotmart.com/YYYYYYYY?off=...   # Yoreh De'ah
HOTMART_CHECKOUT_TRATADO_EH=https://pay.hotmart.com/YYYYYYYY?off=...   # Even HaEzer
HOTMART_CHECKOUT_TRATADO_CM=https://pay.hotmart.com/YYYYYYYY?off=...   # Choshen Mishpat
```

Sem um link, o botão daquele plano leva ao aviso "Pagamentos em configuração" (o site não quebra).
Os links não são segredo, mas ficam só no servidor (sem `NEXT_PUBLIC_`).

## Aplicação

```env
# URL pública do site, sem barra no final
NEXT_PUBLIC_BASE_URL=https://www.or-halacha.com.br

# Token de administração (header Authorization: Bearer <token>):
#  - POST /api/admin/sortear-siman (cron do siman do dia)
#  - POST /api/admin/hotmart/reprocessar (reaplica eventos da Hotmart que ficaram com erro)
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
- `SUPABASE_SERVICE_ROLE_KEY`, `HOTMART_HOTTOK`, `ADMIN_SECRET_TOKEN` e `SMTP_PASS` são segredos de servidor.
- As variáveis antigas do Stripe (`STRIPE_*`, `NEXT_PUBLIC_STRIPE_PRICE_*`) não são mais usadas e
  podem ser apagadas da Vercel.
