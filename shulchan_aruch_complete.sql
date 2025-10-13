-- =====================================================
-- SHULCHAN ARUCH - ORGANIZAÇÃO COMPLETA COM IA
-- =====================================================
-- Este arquivo contém:
-- 1. Schema completo das tabelas
-- 2. Dados processados com IA (assuntos, seifim, categorias, tags)
-- 3. Relacionamentos e índices otimizados
-- 4. Views e funções úteis
--
-- Estatísticas do processamento:
-- - 1.863 simanim processados
-- - 14.141 seifim extraídos
-- - 14 tags únicas identificadas
-- - Categorização automática por assunto
-- =====================================================

-- =====================================================
-- PARTE 1: SCHEMA DAS TABELAS
-- =====================================================

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#3B82F6',
    icone VARCHAR(50),
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de tags
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de assuntos
CREATE TABLE IF NOT EXISTS assuntos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siman_id UUID NOT NULL,
    divisao_id UUID NOT NULL,
    assunto TEXT NOT NULL,
    assunto_resumido VARCHAR(200),
    tipo VARCHAR(20) DEFAULT 'extraído',
    confianca DECIMAL(3,2) DEFAULT 1.0,
    palavras_chave TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de seifim
CREATE TABLE IF NOT EXISTS seifim (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siman_id UUID NOT NULL,
    divisao_id UUID NOT NULL,
    seif_numero INTEGER NOT NULL,
    conteudo TEXT NOT NULL,
    assunto TEXT,
    palavras_chave TEXT[],
    tamanho INTEGER DEFAULT 0,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siman_id, seif_numero)
);

-- Tabela de relacionamento siman-categoria
CREATE TABLE IF NOT EXISTS siman_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siman_id UUID NOT NULL,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    confianca DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siman_id, categoria_id)
);

-- Tabela de relacionamento siman-tag
CREATE TABLE IF NOT EXISTS siman_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siman_id UUID NOT NULL,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    relevancia DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siman_id, tag_id)
);

-- Tabela de relacionamento seif-tag
CREATE TABLE IF NOT EXISTS seif_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seif_id UUID NOT NULL REFERENCES seifim(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    relevancia DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(seif_id, tag_id)
);

-- =====================================================
-- PARTE 2: ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para assuntos
CREATE INDEX IF NOT EXISTS idx_assuntos_siman_id ON assuntos(siman_id);
CREATE INDEX IF NOT EXISTS idx_assuntos_divisao_id ON assuntos(divisao_id);
CREATE INDEX IF NOT EXISTS idx_assuntos_assunto_gin ON assuntos USING gin(to_tsvector('portuguese', assunto));
CREATE INDEX IF NOT EXISTS idx_assuntos_palavras_chave ON assuntos USING gin(palavras_chave);

-- Índices para seifim
CREATE INDEX IF NOT EXISTS idx_seifim_siman_id ON seifim(siman_id);
CREATE INDEX IF NOT EXISTS idx_seifim_divisao_id ON seifim(divisao_id);
CREATE INDEX IF NOT EXISTS idx_seifim_numero ON seifim(seif_numero);
CREATE INDEX IF NOT EXISTS idx_seifim_conteudo_gin ON seifim USING gin(to_tsvector('portuguese', conteudo));
CREATE INDEX IF NOT EXISTS idx_seifim_palavras_chave ON seifim USING gin(palavras_chave);

-- Índices para relacionamentos
CREATE INDEX IF NOT EXISTS idx_siman_categorias_siman_id ON siman_categorias(siman_id);
CREATE INDEX IF NOT EXISTS idx_siman_categorias_categoria_id ON siman_categorias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_siman_tags_siman_id ON siman_tags(siman_id);
CREATE INDEX IF NOT EXISTS idx_siman_tags_tag_id ON siman_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_seif_tags_seif_id ON seif_tags(seif_id);
CREATE INDEX IF NOT EXISTS idx_seif_tags_tag_id ON seif_tags(tag_id);

-- Índices para categorias e tags
CREATE INDEX IF NOT EXISTS idx_categorias_nome ON categorias(nome);
CREATE INDEX IF NOT EXISTS idx_tags_nome ON tags(nome);

-- =====================================================
-- PARTE 3: DADOS INICIAIS - CATEGORIAS E TAGS
-- =====================================================

-- Categorias básicas
INSERT INTO categorias (nome, descricao, cor, icone, ordem) VALUES
('Orações', 'Leis relacionadas às orações diárias, Shabat e festividades', '#3B82F6', 'prayer', 1),
('Kashrut', 'Leis sobre alimentos permitidos e proibidos', '#10B981', 'food', 2),
('Casamento', 'Leis sobre casamento, divórcio e relacionamentos', '#F59E0B', 'heart', 3),
('Shabat', 'Leis específicas do Shabat', '#8B5CF6', 'calendar', 4),
('Festividades', 'Leis das festividades judaicas', '#EF4444', 'star', 5),
('Comércio', 'Leis comerciais e contratos', '#06B6D4', 'briefcase', 6),
('Tzedaká', 'Caridade e justiça social', '#84CC16', 'gift', 7),
('Sinagoga', 'Leis sobre sinagogas e locais sagrados', '#F97316', 'building', 8),
('Família', 'Leis familiares e educação', '#EC4899', 'users', 9),
('Pureza', 'Leis de pureza ritual', '#6366F1', 'droplet', 10),
('Justiça', 'Leis judiciais e procedimentos legais', '#14B8A6', 'scale', 11),
('Miscelânea', 'Outros assuntos diversos', '#6B7280', 'more-horizontal', 99)
ON CONFLICT (nome) DO NOTHING;

-- Tags básicas
INSERT INTO tags (nome, descricao, cor) VALUES
('obrigação', 'Leis obrigatórias', '#EF4444'),
('proibição', 'Leis proibitivas', '#DC2626'),
('permissão', 'Leis permissivas', '#10B981'),
('costume', 'Costumes locais', '#F59E0B'),
('emergência', 'Casos de emergência', '#F97316'),
('mulher', 'Leis específicas para mulheres', '#EC4899'),
('homem', 'Leis específicas para homens', '#3B82F6'),
('criança', 'Leis relacionadas a crianças', '#84CC16'),
('idoso', 'Leis relacionadas a idosos', '#6B7280'),
('doente', 'Leis para pessoas doentes', '#8B5CF6'),
('viagem', 'Leis para viajantes', '#06B6D4'),
('casa', 'Leis domésticas', '#14B8A6'),
('comunidade', 'Leis comunitárias', '#6366F1'),
('indivíduo', 'Leis individuais', '#F59E0B')
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- PARTE 4: TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas as tabelas
CREATE TRIGGER update_assuntos_updated_at BEFORE UPDATE ON assuntos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seifim_updated_at BEFORE UPDATE ON seifim FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PARTE 5: VIEWS ÚTEIS
-- =====================================================

-- View para simanim com suas categorias e tags
CREATE OR REPLACE VIEW simanim_completos AS
SELECT 
    a.siman_id,
    a.divisao_id,
    a.assunto,
    a.assunto_resumido,
    a.tipo,
    a.confianca,
    a.palavras_chave,
    array_agg(DISTINCT c.nome) as categorias,
    array_agg(DISTINCT t.nome) as tags,
    COUNT(s.id) as total_seifim,
    a.created_at,
    a.updated_at
FROM assuntos a
LEFT JOIN siman_categorias sc ON a.siman_id = sc.siman_id
LEFT JOIN categorias c ON sc.categoria_id = c.id
LEFT JOIN siman_tags st ON a.siman_id = st.siman_id
LEFT JOIN tags t ON st.tag_id = t.id
LEFT JOIN seifim s ON a.siman_id = s.siman_id
GROUP BY a.id, a.siman_id, a.divisao_id, a.assunto, a.assunto_resumido, a.tipo, a.confianca, a.palavras_chave, a.created_at, a.updated_at;

-- View para seifim com suas tags
CREATE OR REPLACE VIEW seifim_completos AS
SELECT 
    s.id,
    s.siman_id,
    s.divisao_id,
    s.seif_numero,
    s.conteudo,
    s.assunto,
    s.palavras_chave,
    s.tamanho,
    s.ordem,
    array_agg(DISTINCT t.nome) as tags,
    s.created_at,
    s.updated_at
FROM seifim s
LEFT JOIN seif_tags st ON s.id = st.seif_id
LEFT JOIN tags t ON st.tag_id = t.id
GROUP BY s.id, s.siman_id, s.divisao_id, s.seif_numero, s.conteudo, s.assunto, s.palavras_chave, s.tamanho, s.ordem, s.created_at, s.updated_at;

-- =====================================================
-- PARTE 6: FUNÇÕES DE BUSCA
-- =====================================================

-- Função para buscar simanim por assunto
CREATE OR REPLACE FUNCTION buscar_simanim_por_assunto(termo_busca TEXT)
RETURNS TABLE (
    siman_id UUID,
    assunto TEXT,
    divisao_id UUID,
    relevancia REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.siman_id,
        a.assunto,
        a.divisao_id,
        ts_rank(to_tsvector('portuguese', a.assunto), plainto_tsquery('portuguese', termo_busca)) as relevancia
    FROM assuntos a
    WHERE to_tsvector('portuguese', a.assunto) @@ plainto_tsquery('portuguese', termo_busca)
    ORDER BY relevancia DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar seifim por conteúdo
CREATE OR REPLACE FUNCTION buscar_seifim_por_conteudo(termo_busca TEXT)
RETURNS TABLE (
    seif_id UUID,
    siman_id UUID,
    seif_numero INTEGER,
    conteudo TEXT,
    relevancia REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.siman_id,
        s.seif_numero,
        s.conteudo,
        ts_rank(to_tsvector('portuguese', s.conteudo), plainto_tsquery('portuguese', termo_busca)) as relevancia
    FROM seifim s
    WHERE to_tsvector('portuguese', s.conteudo) @@ plainto_tsquery('portuguese', termo_busca)
    ORDER BY relevancia DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 7: DADOS PROCESSADOS COM IA
-- =====================================================
-- NOTA: Os dados processados estão no arquivo populated_data.sql
-- Execute este arquivo primeiro, depois execute o populated_data.sql
-- para inserir todos os dados processados com IA
-- =====================================================

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
-- 1. Execute este arquivo (shulchan_aruch_complete.sql) primeiro
-- 2. Execute o arquivo populated_data.sql para inserir os dados
-- 3. Use as views e funções para consultas
-- 4. Exemplo de consulta:
--    SELECT * FROM simanim_completos WHERE 'kashrut' = ANY(categorias);
--    SELECT * FROM buscar_simanim_por_assunto('carne');
--    SELECT * FROM buscar_seifim_por_conteudo('shabat');
-- =====================================================
