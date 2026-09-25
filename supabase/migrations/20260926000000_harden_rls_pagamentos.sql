-- =====================================================================
-- Endurecimento de RLS: pagamentos e perfis
-- =====================================================================
-- Antes: o usuário podia INSERIR/ATUALIZAR as próprias linhas em
-- `subscriptions` e `purchased_books` (liberando acesso pago sem pagar) e
-- atualizar qualquer coluna do próprio profile (inclusive is_admin e
-- stripe_customer_id). Perfis eram visíveis para todos.
--
-- Depois:
--   * subscriptions / purchased_books: usuário só LÊ as próprias linhas.
--     Escritas são feitas apenas pelo servidor (service role: webhook do
--     Stripe e rotas de API).
--   * profiles: usuário lê/edita só o próprio perfil e apenas as colunas
--     full_name, avatar_url e updated_at.
--
-- IMPORTANTE: o servidor precisa da variável SUPABASE_SERVICE_ROLE_KEY
-- configurada (Vercel) ANTES de aplicar esta migration.
-- =====================================================================

-- Remove TODAS as policies existentes nestas tabelas (inclusive policies
-- permissivas criadas manualmente no painel), para recriar do zero.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('subscriptions', 'purchased_books', 'profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.subscriptions FROM anon, authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- purchased_books
-- ---------------------------------------------------------------------
ALTER TABLE public.purchased_books ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.purchased_books FROM anon, authenticated;
GRANT SELECT ON public.purchased_books TO authenticated;

CREATE POLICY "purchased_books_select_own" ON public.purchased_books
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
-- Apenas colunas editáveis pelo próprio usuário
GRANT UPDATE (full_name, avatar_url, updated_at)
  ON public.profiles TO authenticated;
GRANT INSERT (id, full_name, avatar_url, created_at, updated_at)
  ON public.profiles TO authenticated;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
