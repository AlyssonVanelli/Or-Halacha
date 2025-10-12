-- Função para sortear e gravar o Siman do Dia com nome do tratado
CREATE OR REPLACE FUNCTION public.sortear_siman_do_dia()
RETURNS void AS $$
DECLARE
    hoje DATE := CURRENT_DATE;
    siman_registro RECORD;
    livro_registro RECORD;
    tratado_nome TEXT;
    seif_texto TEXT;
    simanim_ids UUID[];
    livros_ids UUID[];
    conteudo TEXT;
    seif_arr TEXT[];
BEGIN
    -- Só executa se ainda não existe siman para hoje
    IF NOT EXISTS (SELECT 1 FROM siman_do_dia WHERE data = hoje) THEN
        -- Busca os 3 primeiros livros
        SELECT array_agg(id) INTO livros_ids FROM (
            SELECT id FROM books ORDER BY title LIMIT 3
        ) sub;

        -- Busca todos os simanim desses livros
        SELECT array_agg(id) INTO simanim_ids FROM chapters WHERE book_id = ANY(livros_ids) AND is_published = TRUE;

        -- Sorteia um siman aleatório
        SELECT * INTO siman_registro FROM chapters WHERE id = (
            SELECT unnest(simanim_ids) ORDER BY random() LIMIT 1
        );

        -- Busca o nome do livro
        SELECT title INTO livro_registro FROM books WHERE id = siman_registro.book_id;

        -- Busca o nome do tratado/divisão
        SELECT title INTO tratado_nome FROM divisions WHERE id = siman_registro.division_id;

        -- Busca o conteúdo do siman
        SELECT content INTO conteudo FROM content WHERE chapter_id = siman_registro.id;

        -- Extrai seifim numerados ou parágrafos
        IF conteudo IS NOT NULL THEN
            -- Tenta dividir por seifim numerados
            seif_arr := regexp_split_to_array(conteudo, '\n\\d+\\.\\s');
            IF array_length(seif_arr, 1) IS NULL OR array_length(seif_arr, 1) < 2 THEN
                -- Se não encontrou, divide por parágrafos
                seif_arr := regexp_split_to_array(conteudo, '\n{2,}');
            END IF;
            -- Pega o segundo seif/parágrafo, ou o primeiro se não houver
            seif_texto := COALESCE(seif_arr[2], seif_arr[1], '');
        ELSE
            seif_texto := '';
        END IF;

        -- Insere o siman do dia
        INSERT INTO siman_do_dia (data, siman_id, livro, tratado, titulo, numero, seif)
        VALUES (
            hoje,
            siman_registro.id,
            livro_registro.title,
            tratado_nome,
            siman_registro.title,
            siman_registro.position,
            seif_texto
        );
    END IF;
END;
$$ LANGUAGE plpgsql; 