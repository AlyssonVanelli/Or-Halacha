declare namespace NodeJS {
  interface ProcessEnv {
    // Hotmart (pagamentos)
    HOTMART_HOTTOK?: string
    HOTMART_CHECKOUT_MENSAL?: string
    HOTMART_CHECKOUT_MENSAL_PLUS?: string
    HOTMART_CHECKOUT_ANUAL?: string
    HOTMART_CHECKOUT_ANUAL_PLUS?: string
    HOTMART_CHECKOUT_TRATADO_OC?: string
    HOTMART_CHECKOUT_TRATADO_YD?: string
    HOTMART_CHECKOUT_TRATADO_EH?: string
    HOTMART_CHECKOUT_TRATADO_CM?: string
    ADMIN_SECRET_TOKEN?: string

    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY: string

    SUPABASE_URL: string
    VERCEL_URL?: string
    JWT_SECRET: string

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
