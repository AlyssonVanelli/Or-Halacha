-- =====================================================================
-- Proteção do conteúdo pago e de dados pessoais
-- =====================================================================
-- Verificado em produção (26/09/2026) com a chave anon pública, sem login:
--   * content  (1.863 simanim) e sections (18.857 seifim, inclusive a
--     explicação prática do Plus) eram legíveis por qualquer pessoa;
--   * support_requests (nome, email e mensagem de clientes) e
--     data_consents eram legíveis por qualquer pessoa.
--
-- Depois desta migration o texto só sai pelo servidor (rotas /api/conteudo,
-- /api/search, /api/explicacao-pratica, /api/siman-do-dia), que aplica as
-- regras de acesso (assinatura, tratado comprado, siman gratuito do dia).
--
-- Aplicar DEPOIS do deploy da versão que usa essas rotas.
-- =====================================================================

-- Administrador (profiles.is_admin), usado pelo editor de conteúdo do painel
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Remove todas as policies existentes nas tabelas tratadas aqui
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('content', 'sections', 'support_requests', 'data_consents', 'favorites')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- Conteúdo: apenas o servidor (service role) e administradores
-- ---------------------------------------------------------------------
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.content FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content TO authenticated;
CREATE POLICY "content_admin_all" ON public.content
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sections FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;
CREATE POLICY "sections_admin_all" ON public.sections
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- Pedidos de suporte: gravados só pelo servidor
-- ---------------------------------------------------------------------
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_requests FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- Consentimentos (LGPD): cada usuário vê e registra só os próprios
-- ---------------------------------------------------------------------
ALTER TABLE public.data_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.data_consents FROM anon, authenticated;
GRANT SELECT, INSERT ON public.data_consents TO authenticated;
CREATE POLICY "data_consents_select_own" ON public.data_consents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "data_consents_insert_own" ON public.data_consents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Favoritos: cada usuário gerencia só os próprios
-- ---------------------------------------------------------------------
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.favorites FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
CREATE POLICY "favorites_own_all" ON public.favorites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
