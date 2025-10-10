# Configuração do Siman Diário Automático

## 🎯 Visão Geral

O sistema de siman diário automático sorteia um novo siman todos os dias às 00:01 (meia-noite + 1 minuto) usando cron jobs do Supabase.

## 🔧 Configuração

### 1. **Supabase (Recomendado)**

#### Passo 1: Aplicar a migração
```bash
# No diretório do projeto
supabase db push
```

#### Passo 2: Verificar se o cron job foi criado
```sql
-- Conectar ao Supabase SQL Editor e executar:
SELECT * FROM cron.job WHERE jobname IN ('siman-daily-schedule', 'siman-daily-fallback');
```

#### Passo 3: Testar manualmente
```sql
-- Executar a função manualmente para testar
SELECT public.sortear_siman_do_dia();
```

### 2. **API Manual (Fallback)**

#### Configurar token de admin
```bash
# Adicionar ao .env.local
ADMIN_SECRET_TOKEN=seu_token_secreto_aqui
```

#### Testar via API
```bash
# Verificar se já existe siman para hoje
curl -X GET https://seu-dominio.com/api/admin/sortear-siman

# Executar sorteio manual
curl -X POST https://seu-dominio.com/api/admin/sortear-siman \
  -H "Authorization: Bearer seu_token_secreto_aqui"
```

### 3. **Script de Teste**

```bash
# Instalar dependências se necessário
npm install @supabase/supabase-js

# Configurar variáveis de ambiente
export NEXT_PUBLIC_SUPABASE_URL=sua_url
export SUPABASE_SERVICE_ROLE_KEY=sua_service_key

# Executar teste
node scripts/test-siman-daily.js
```

## 📋 Monitoramento

### Verificar se o cron está funcionando
```sql
-- Ver logs de execução
SELECT * FROM cron.job_run_details 
WHERE jobname = 'siman-daily-schedule' 
ORDER BY start_time DESC 
LIMIT 10;
```

### Verificar simans do dia
```sql
-- Ver últimos simans sorteados
SELECT * FROM siman_do_dia 
ORDER BY data DESC 
LIMIT 7;
```

## 🚨 Troubleshooting

### Problema: Cron job não executa
1. Verificar se a extensão pg_cron está habilitada
2. Verificar permissões do usuário
3. Executar manualmente para testar

### Problema: Função retorna erro
1. Verificar se as tabelas existem
2. Verificar se há dados nas tabelas books, chapters, divisions
3. Executar a função manualmente para ver o erro

### Problema: API manual não funciona
1. Verificar se o token ADMIN_SECRET_TOKEN está configurado
2. Verificar se a função RPC está disponível
3. Verificar logs do servidor

## 🔄 Alternativa: Vercel Cron Jobs

Se preferir usar Vercel, pode criar um cron job:

### 1. Criar API route
```typescript
// app/api/cron/siman-daily/route.ts
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Executar sorteio
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/sortear-siman`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ADMIN_SECRET_TOKEN}`
    }
  })
  
  return new Response('OK')
}
```

### 2. Configurar no vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/siman-daily",
      "schedule": "1 0 * * *"
    }
  ]
}
```

## 📊 Vantagens de cada abordagem

### Supabase (Recomendado)
- ✅ Execução direta no banco
- ✅ Mais confiável
- ✅ Gratuito
- ✅ Menos latência

### Vercel
- ✅ Integração com deploy
- ✅ Logs centralizados
- ❌ Depende de HTTP
- ❌ Pode ter timeouts
- ❌ Mais complexo

## 🎯 Recomendação Final

**Use Supabase** - É mais simples, confiável e eficiente para este caso de uso.
