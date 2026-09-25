-- =====================================================================
-- Busca sem acento e sem diferença de maiúsculas ("mezuza" encontra "mezuzá")
-- =====================================================================
-- Usada pela rota /api/search (servidor, service role). Se esta migration
-- ainda não foi aplicada, a rota volta para a busca simples (com acento).
-- =====================================================================

-- As extensões podem já existir em "public" ou "extensions"; o search_path cobre os dois
SET LOCAL search_path = public, extensions;

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- unaccent() não é IMMUTABLE; este wrapper permite usá-lo em índice
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
SET search_path = public, extensions
AS $$
  SELECT unaccent('unaccent'::regdictionary, $1)
$$;

-- Índice trigram para o ILIKE '%termo%' não varrer 18 mil linhas a cada busca
CREATE INDEX IF NOT EXISTS sections_content_unaccent_trgm
  ON public.sections
  USING gin (lower(public.f_unaccent(content)) gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_sections(
  p_query text,
  p_division_id uuid DEFAULT NULL,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  number int,
  content text,
  chapter_id uuid,
  chapter_title text,
  chapter_position int,
  division_id uuid,
  appendix_type text,
  division_title text,
  total_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  WITH matches AS (
    SELECT s.id::uuid AS id, s.number::int AS number, s.content::text AS content,
           s.chapter_id::uuid AS chapter_id,
           c.title::text AS chapter_title, c.position::int AS chapter_position,
           c.division_id::uuid AS division_id, c.appendix_type::text AS appendix_type,
           d.title::text AS division_title
    FROM public.sections s
    JOIN public.chapters c ON c.id = s.chapter_id
    LEFT JOIN public.divisions d ON d.id = c.division_id
    WHERE lower(public.f_unaccent(s.content))
          LIKE '%' || lower(public.f_unaccent(
            replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_')
          )) || '%'
      AND (p_division_id IS NULL OR c.division_id = p_division_id)
  )
  SELECT m.*, count(*) OVER () AS total_count
  FROM matches m
  ORDER BY m.division_id NULLS LAST, m.chapter_position, m.number
  LIMIT p_limit OFFSET p_offset
$$;

-- Só o servidor chama esta função
REVOKE ALL ON FUNCTION public.search_sections(text, uuid, int, int) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_sections(text, uuid, int, int) TO service_role;
