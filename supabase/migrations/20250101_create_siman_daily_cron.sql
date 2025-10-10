-- Migração para criar cron job do siman diário
-- Este arquivo cria um cron job que executa a função sortear_siman_do_dia() diariamente

-- Primeiro, vamos garantir que a extensão pg_cron está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar o cron job para executar diariamente às 00:01 (1 minuto após meia-noite)
-- Isso garante que o siman seja sorteado logo no início do dia
SELECT cron.schedule(
    'siman-daily-schedule',
    '1 0 * * *', -- Executa diariamente às 00:01
    'SELECT public.sortear_siman_do_dia();'
);

-- Opcional: Criar um job de backup que executa se o primeiro falhar
-- Executa às 06:00 como fallback
SELECT cron.schedule(
    'siman-daily-fallback',
    '0 6 * * *', -- Executa diariamente às 06:00
    'SELECT public.sortear_siman_do_dia();'
);

-- Verificar se os jobs foram criados
SELECT * FROM cron.job WHERE jobname IN ('siman-daily-schedule', 'siman-daily-fallback');
