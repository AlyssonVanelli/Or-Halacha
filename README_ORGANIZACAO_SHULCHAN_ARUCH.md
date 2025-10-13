# 🕍 Organização do Shulchan Aruch com IA

## 📋 Resumo do Projeto

Este projeto organiza completamente o conteúdo do Shulchan Aruch usando Inteligência Artificial para:

- **Extrair assuntos** de cada siman automaticamente
- **Separar seifim** individualmente 
- **Categorizar** por assunto (Kashrut, Orações, Casamento, etc.)
- **Gerar tags** para busca específica
- **Criar índices** otimizados para performance

## 📊 Estatísticas do Processamento

- ✅ **1.863 simanim** processados
- ✅ **14.141 seifim** extraídos e separados
- ✅ **14 tags únicas** identificadas
- ✅ **12 categorias** principais criadas
- ✅ **Busca full-text** em português implementada

## 🗂️ Arquivos Gerados

### 1. `database_schema.sql`
- Schema completo das tabelas
- Índices otimizados
- Views e funções úteis
- Dados iniciais (categorias e tags)

### 2. `populated_data.sql` (15MB)
- Todos os dados processados com IA
- Assuntos extraídos de cada siman
- Seifim separados individualmente
- Relacionamentos categoria/tag

### 3. `shulchan_aruch_complete.sql`
- Arquivo consolidado com schema + instruções
- Pronto para execução no Supabase

### 4. `process_content_with_ai.py`
- Script de processamento com IA
- Algoritmos de extração de assunto
- Separação inteligente de seifim
- Categorização automática

## 🚀 Como Usar

### Passo 1: Executar Schema
```sql
-- No Supabase SQL Editor, execute:
-- 1. shulchan_aruch_complete.sql (cria estrutura)
-- 2. populated_data.sql (insere dados processados)
```

### Passo 2: Consultas Úteis

#### Buscar por assunto:
```sql
SELECT * FROM simanim_completos 
WHERE 'Kashrut' = ANY(categorias);
```

#### Buscar por palavra-chave:
```sql
SELECT * FROM buscar_simanim_por_assunto('carne');
```

#### Buscar seifim específicos:
```sql
SELECT * FROM buscar_seifim_por_conteudo('shabat');
```

#### Ver siman completo com seifim:
```sql
SELECT * FROM seifim_completos 
WHERE siman_id = 'seu-siman-id'
ORDER BY seif_numero;
```

## 🏗️ Estrutura das Tabelas

### Tabelas Principais:
- **`assuntos`** - Assunto de cada siman
- **`seifim`** - Cada seif separado
- **`categorias`** - Categorias principais
- **`tags`** - Tags para busca específica

### Tabelas de Relacionamento:
- **`siman_categorias`** - Relaciona simanim com categorias
- **`siman_tags`** - Relaciona simanim com tags
- **`seif_tags`** - Relaciona seifim com tags

## 🎯 Categorias Disponíveis

1. **Orações** - Leis de orações diárias
2. **Kashrut** - Leis alimentares
3. **Casamento** - Leis matrimoniais
4. **Shabat** - Leis do Shabat
5. **Festividades** - Leis das festividades
6. **Comércio** - Leis comerciais
7. **Tzedaká** - Caridade e justiça
8. **Sinagoga** - Leis de sinagogas
9. **Família** - Leis familiares
10. **Pureza** - Leis de pureza ritual
11. **Justiça** - Leis judiciais
12. **Miscelânea** - Outros assuntos

## 🏷️ Tags Disponíveis

- **obrigação** - Leis obrigatórias
- **proibição** - Leis proibitivas  
- **permissão** - Leis permissivas
- **costume** - Costumes locais
- **emergência** - Casos especiais
- **mulher** - Leis para mulheres
- **homem** - Leis para homens
- **criança** - Leis para crianças
- **idoso** - Leis para idosos
- **doente** - Leis para doentes
- **viagem** - Leis para viajantes
- **casa** - Leis domésticas
- **comunidade** - Leis comunitárias
- **indivíduo** - Leis individuais

## 🔍 Funcionalidades de Busca

### Busca Full-Text:
- Busca em português otimizada
- Ranking por relevância
- Busca em assuntos e conteúdo

### Filtros Avançados:
- Por categoria
- Por tag
- Por divisão
- Por confiança da extração

### Views Úteis:
- **`simanim_completos`** - Simanim com categorias e tags
- **`seifim_completos`** - Seifim com tags

## 📈 Performance

- **Índices GIN** para busca full-text
- **Índices B-tree** para consultas rápidas
- **Arrays** para palavras-chave
- **Views materializadas** para consultas complexas

## 🛠️ Manutenção

### Reprocessar Dados:
```bash
python process_content_with_ai.py
```

### Adicionar Nova Categoria:
```sql
INSERT INTO categorias (nome, descricao, cor) 
VALUES ('Nova Categoria', 'Descrição', '#FF0000');
```

### Adicionar Nova Tag:
```sql
INSERT INTO tags (nome, descricao, cor) 
VALUES ('nova_tag', 'Descrição', '#00FF00');
```

## 🎉 Benefícios

1. **Organização Completa** - Todo conteúdo estruturado
2. **Busca Inteligente** - Encontre qualquer assunto rapidamente
3. **Navegação Fácil** - Seifim separados e organizados
4. **Categorização Automática** - IA categoriza automaticamente
5. **Performance Otimizada** - Consultas rápidas com índices
6. **Escalabilidade** - Estrutura preparada para crescimento

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique os logs de processamento
- Consulte as views para entender a estrutura
- Use as funções de busca para testar

---

**Desenvolvido com IA para organização completa do Shulchan Aruch** 🕍✨
