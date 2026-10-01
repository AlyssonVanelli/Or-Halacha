-- =====================================================================
-- Pagamentos pela Hotmart (substitui o Stripe)
-- =====================================================================
-- * subscriptions / purchased_books passam a registrar a origem (provider) e o
--   código da transação/assinante na Hotmart.
-- * payment_events guarda cada notificação do webhook (sem dados sensíveis do
--   comprador): evita processar o mesmo evento duas vezes, serve de histórico
--   de pagamentos e permite reprocessar compras que chegaram antes do cadastro.
-- * find_user_id_by_email: localiza a conta pelo e-mail do comprador quando a
--   compra não veio de um link do site.
-- =====================================================================

SET LOCAL search_path = public;

-- ---------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS next_charge_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_transaction_id text;

UPDATE public.subscriptions SET provider = 'stripe' WHERE provider IS NULL;
ALTER TABLE public.subscriptions ALTER COLUMN provider SET DEFAULT 'hotmart';
ALTER TABLE public.subscriptions ALTER COLUMN provider SET NOT NULL;

COMMENT ON COLUMN public.subscriptions.subscription_id IS
  'Código do assinante na Hotmart (subscriber code); antes, id da assinatura no Stripe';
COMMENT ON COLUMN public.subscriptions.price_id IS
  'Código da oferta/plano na Hotmart (off=...)';
COMMENT ON COLUMN public.subscriptions.next_charge_at IS
  'Próxima cobrança informada pela Hotmart. current_period_end = acesso até (com tolerância)';

-- ---------------------------------------------------------------------
-- purchased_books (tratado avulso)
-- ---------------------------------------------------------------------
ALTER TABLE public.purchased_books
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS transaction_id text;

UPDATE public.purchased_books SET provider = 'stripe' WHERE provider IS NULL;
ALTER TABLE public.purchased_books ALTER COLUMN provider SET DEFAULT 'hotmart';
ALTER TABLE public.purchased_books ALTER COLUMN provider SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchased_books_transaction_id
  ON public.purchased_books (transaction_id)
  WHERE transaction_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- payment_events
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
  id text PRIMARY KEY,                       -- id do evento enviado pela Hotmart
  provider text NOT NULL DEFAULT 'hotmart',
  event text NOT NULL,                       -- PURCHASE_APPROVED, SUBSCRIPTION_CANCELLATION...
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'ignored', 'pending_user', 'error')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_email text,
  transaction_id text,
  subscriber_code text,
  item text,                                 -- plano (mensal-basico...) ou id do tratado
  amount numeric(12, 2),
  currency text,
  error text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payment_events_user_id ON public.payment_events (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_pending_email
  ON public.payment_events (lower(buyer_email))
  WHERE status = 'pending_user';
CREATE INDEX IF NOT EXISTS idx_payment_events_status ON public.payment_events (status)
  WHERE status IN ('pending_user', 'error');

-- Só o servidor (service role) lê e escreve
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_events FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- Conta pelo e-mail do comprador (somente service role)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_user_id_by_email(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(text) TO service_role;
