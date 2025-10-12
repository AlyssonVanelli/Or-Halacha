# Variáveis de Ambiente

Este documento lista todas as variáveis de ambiente necessárias para executar o projeto Or Halachá.

## Configuração do Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Configuração do Stripe

```env
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

## Configuração de Email (Nodemailer)

```env
SMTP_HOST=your_smtp_host_here
SMTP_PORT=587
SMTP_USER=your_smtp_user_here
SMTP_PASS=your_smtp_password_here
FROM_EMAIL=your_from_email_here
```

## Configuração da Aplicação

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Configuração do Banco de Dados (se usando conexão direta)

```env
DATABASE_URL=your_database_url_here
```

## Como configurar

1. Copie o arquivo `.env.example` para `.env.local`
2. Preencha todas as variáveis com os valores corretos
3. Reinicie o servidor de desenvolvimento

## Segurança

- **NUNCA** commite arquivos `.env` ou `.env.local` para o repositório
- Use valores seguros para `NEXTAUTH_SECRET`
- Mantenha as chaves do Stripe e Supabase seguras
