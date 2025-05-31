declare namespace NodeJS {
  interface ProcessEnv {
    STRIPE_PUBLIC_KEY: string
    STRIPE_SECRET_KEY: string
    STRIPE_WEBHOOK_SECRET: string

    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY: string

    NEXT_PUBLIC_BASE_URL: string

    // SMTP
    SMTP_HOST: string
    SMTP_PORT: string
    SMTP_USER: string
    SMTP_PASS: string
    SMTP_FROM: string
    SMTP_TO: string

    // Outras variáveis de ambiente conforme necessário
  }
}
