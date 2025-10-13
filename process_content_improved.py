#!/usr/bin/env python3
"""
Script MELHORADO para processar o CSV do Shulchan Aruch com IA
- Títulos específicos e curtos quando não há assunto claro
- Preserva assuntos originais quando existem
"""

import csv
import json
import re
import uuid
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ProcessedSiman:
    """Estrutura para um siman processado"""
    original_id: str
    chapter_id: str
    assunto: str
    assunto_resumido: str
    categoria: str
    tags: List[str]
    seifim: List[Dict[str, Any]]
    confianca: float
    palavras_chave: List[str]
    tem_assunto_original: bool

class ImprovedShulchanAruchProcessor:
    """Processador MELHORADO de IA para o Shulchan Aruch"""
    
    def __init__(self):
        self.categorias_map = {
            'kashrut': 'Kashrut',
            'carne': 'Kashrut',
            'alimento': 'Kashrut',
            'comida': 'Kashrut',
            'mercado': 'Kashrut',
            'vendedor': 'Kashrut',
            'idólatra': 'Kashrut',
            'sinagoga': 'Sinagoga',
            'oração': 'Orações',
            'rezar': 'Orações',
            'shabat': 'Shabat',
            'casamento': 'Casamento',
            'mulher': 'Casamento',
            'homem': 'Casamento',
            'família': 'Família',
            'filho': 'Família',
            'comércio': 'Comércio',
            'contrato': 'Comércio',
            'justiça': 'Justiça',
            'tribunal': 'Justiça',
            'testemunha': 'Justiça',
            'tzedaká': 'Tzedaká',
            'caridade': 'Tzedaká',
            'chanucá': 'Festividades',
            'festividade': 'Festividades',
            'purificação': 'Pureza',
            'pureza': 'Pureza'
        }
        
        self.tags_map = {
            'obrigação': ['obrigado', 'deve', 'precisa', 'mitzvá'],
            'proibição': ['proibido', 'não pode', 'vedado', 'ilegal'],
            'permissão': ['permitido', 'pode', 'autorizado', 'legal'],
            'costume': ['costume', 'tradição', 'uso', 'hábito'],
            'emergência': ['emergência', 'urgente', 'necessidade', 'caso especial'],
            'mulher': ['mulher', 'feminino', 'esposa', 'filha'],
            'homem': ['homem', 'masculino', 'marido', 'filho'],
            'criança': ['criança', 'menor', 'infantil', 'jovem'],
            'idoso': ['idoso', 'velho', 'ancião', 'idoso'],
            'doente': ['doente', 'enfermo', 'doença', 'saúde'],
            'viagem': ['viagem', 'viajar', 'caminho', 'estrada'],
            'casa': ['casa', 'doméstico', 'lar', 'residência'],
            'comunidade': ['comunidade', 'público', 'coletivo', 'grupo'],
            'indivíduo': ['individual', 'pessoal', 'privado', 'pessoa']
        }

    def extract_assunto_improved(self, content: str) -> Tuple[str, str, float, bool]:
        """Extrai o assunto do siman com algoritmo MELHORADO"""
        
        # PADRÃO 1: SIMAN X **Assunto** (assunto original claro)
        pattern1 = r'SIMAN\s+\d+\s+\*\*(.*?)\*\*'
        match1 = re.search(pattern1, content, re.DOTALL)
        if match1:
            assunto = match1.group(1).strip()
            # Remove "Contém X seções" se existir
            assunto = re.sub(r'\s*Contém\s+\d+\s+seções?.*$', '', assunto)
            assunto = re.sub(r'\s*Contém\s+\d+\s+seifim.*$', '', assunto)
            assunto = re.sub(r'\s*Contém\s+\d+\s+parágrafos?.*$', '', assunto)
            return assunto.strip(), assunto[:100], 0.95, True
        
        # PADRÃO 2: SIMAN X Assunto (sem ** mas com título claro)
        pattern2 = r'SIMAN\s+\d+\s+([^1-9][^*\n]{10,100}?)(?:\n|Contém|$)'
        match2 = re.search(pattern2, content, re.DOTALL)
        if match2:
            assunto = match2.group(1).strip()
            # Verifica se parece com um título (não é conteúdo de seif)
            if not re.search(r'^\d+\.', assunto) and len(assunto) < 150:
                return assunto, assunto[:100], 0.9, True
        
        # PADRÃO 3: Primeira frase após SIMAN X (pode ser título)
        pattern3 = r'SIMAN\s+\d+\s+([^1-9][^*\n]{10,80}?)(?:\n|\.)'
        match3 = re.search(pattern3, content, re.DOTALL)
        if match3:
            assunto = match3.group(1).strip()
            # Se não começa com número e não é muito longo, pode ser título
            if not re.search(r'^\d+\.', assunto) and len(assunto) < 100:
                return assunto, assunto[:100], 0.8, True
        
        # FALLBACK: Gerar título específico baseado no conteúdo
        return self.generate_specific_title(content)

    def generate_specific_title(self, content: str) -> Tuple[str, str, float, bool]:
        """Gera título específico e curto baseado no conteúdo"""
        
        # Palavras-chave para identificar o tema principal
        theme_keywords = {
            'carne': 'Carne',
            'mercado': 'Mercado', 
            'vendedor': 'Vendedor',
            'idólatra': 'Idólatra',
            'sinagoga': 'Sinagoga',
            'oração': 'Oração',
            'rezar': 'Oração',
            'shabat': 'Shabat',
            'casamento': 'Casamento',
            'mulher': 'Mulher',
            'homem': 'Homem',
            'filho': 'Filho',
            'família': 'Família',
            'comércio': 'Comércio',
            'contrato': 'Contrato',
            'justiça': 'Justiça',
            'tribunal': 'Tribunal',
            'testemunha': 'Testemunha',
            'tzedaká': 'Tzedaká',
            'caridade': 'Caridade',
            'chanucá': 'Chanucá',
            'festividade': 'Festividade',
            'purificação': 'Purificação',
            'pureza': 'Pureza',
            'sangue': 'Sangue',
            'leite': 'Leite',
            'vinho': 'Vinho',
            'pão': 'Pão',
            'água': 'Água',
            'fogo': 'Fogo',
            'incêndio': 'Incêndio',
            'animal': 'Animal',
            'campo': 'Campo',
            'casa': 'Casa',
            'viagem': 'Viagem',
            'doente': 'Doente',
            'idoso': 'Idoso',
            'criança': 'Criança'
        }
        
        # Encontra palavras-chave no conteúdo
        content_lower = content.lower()
        found_themes = []
        
        for keyword, theme in theme_keywords.items():
            if keyword in content_lower:
                found_themes.append(theme)
        
        # Gera título baseado nos temas encontrados
        if found_themes:
            if len(found_themes) == 1:
                title = f"Leis sobre {found_themes[0]}"
            elif len(found_themes) == 2:
                title = f"Leis sobre {found_themes[0]} e {found_themes[1]}"
            else:
                title = f"Leis sobre {', '.join(found_themes[:2])}"
        else:
            # Fallback: analisa primeira frase para extrair conceito
            first_sentence = content.split('.')[0]
            if 'carne' in first_sentence.lower():
                title = "Leis sobre carne"
            elif 'sinagoga' in first_sentence.lower():
                title = "Leis sobre sinagoga"
            elif 'shabat' in first_sentence.lower():
                title = "Leis sobre Shabat"
            elif 'casamento' in first_sentence.lower():
                title = "Leis sobre casamento"
            else:
                title = "Leis haláchicas diversas"
        
        return title, title, 0.7, False

    def extract_seifim(self, content: str) -> List[Dict[str, Any]]:
        """Separa os seifim do conteúdo"""
        
        seifim = []
        
        # Remove o cabeçalho do siman
        content_clean = re.sub(r'^SIMAN\s+\d+.*?(?=\d+\.)', '', content, flags=re.DOTALL)
        
        # Padrão para encontrar seifim numerados
        pattern = r'(\d+)\.\s+([^0-9].*?)(?=\d+\.|$)'
        matches = re.findall(pattern, content_clean, re.DOTALL)
        
        for i, (numero, conteudo) in enumerate(matches):
            conteudo_clean = conteudo.strip()
            if len(conteudo_clean) > 10:  # Só inclui seifim com conteúdo significativo
                seif = {
                    'numero': int(numero),
                    'conteudo': conteudo_clean,
                    'assunto': self.extract_seif_assunto(conteudo_clean),
                    'palavras_chave': self.extract_palavras_chave(conteudo_clean),
                    'tamanho': len(conteudo_clean),
                    'ordem': i + 1
                }
                seifim.append(seif)
        
        return seifim

    def extract_seif_assunto(self, conteudo: str) -> str:
        """Extrai assunto específico de um seif"""
        
        # Primeira frase do seif
        primeira_frase = conteudo.split('.')[0].strip()
        if len(primeira_frase) > 100:
            primeira_frase = primeira_frase[:100] + '...'
        
        return primeira_frase

    def categorize_assunto(self, assunto: str, conteudo: str) -> str:
        """Categoriza o assunto baseado em palavras-chave"""
        
        texto_completo = (assunto + ' ' + conteudo).lower()
        
        # Conta ocorrências de palavras-chave por categoria
        categoria_scores = {}
        for keyword, categoria in self.categorias_map.items():
            if keyword in texto_completo:
                categoria_scores[categoria] = categoria_scores.get(categoria, 0) + 1
        
        if categoria_scores:
            return max(categoria_scores, key=categoria_scores.get)
        
        return 'Miscelânea'

    def extract_tags(self, assunto: str, conteudo: str) -> List[str]:
        """Extrai tags relevantes"""
        
        tags = []
        texto_completo = (assunto + ' ' + conteudo).lower()
        
        for tag, keywords in self.tags_map.items():
            for keyword in keywords:
                if keyword in texto_completo:
                    tags.append(tag)
                    break
        
        return list(set(tags))  # Remove duplicatas

    def extract_palavras_chave(self, texto: str) -> List[str]:
        """Extrai palavras-chave importantes do texto"""
        
        # Palavras comuns para remover
        stop_words = {'o', 'a', 'de', 'da', 'do', 'em', 'na', 'no', 'para', 'com', 'por', 'que', 'se', 'não', 'é', 'são', 'foi', 'ser', 'ter', 'pode', 'deve', 'pode', 'não', 'mas', 'porém', 'então', 'assim', 'também', 'muito', 'mais', 'menos', 'todos', 'todas', 'alguns', 'algumas', 'outros', 'outras', 'mesmo', 'mesma', 'diferente', 'diferentes'}
        
        # Extrai palavras significativas
        palavras = re.findall(r'\b\w+\b', texto.lower())
        palavras_filtradas = [p for p in palavras if len(p) > 3 and p not in stop_words]
        
        # Conta frequência
        freq = {}
        for palavra in palavras_filtradas:
            freq[palavra] = freq.get(palavra, 0) + 1
        
        # Retorna as mais frequentes
        return sorted(freq.keys(), key=lambda x: freq[x], reverse=True)[:10]

    def process_siman(self, row: Dict[str, Any]) -> ProcessedSiman:
        """Processa um siman completo com algoritmo MELHORADO"""
        
        content = row['content']
        
        # Extrai assunto com algoritmo melhorado
        assunto, assunto_resumido, confianca, tem_assunto_original = self.extract_assunto_improved(content)
        
        # Separa seifim
        seifim = self.extract_seifim(content)
        
        # Categoriza
        categoria = self.categorize_assunto(assunto, content)
        
        # Extrai tags
        tags = self.extract_tags(assunto, content)
        
        # Extrai palavras-chave
        palavras_chave = self.extract_palavras_chave(assunto + ' ' + content)
        
        return ProcessedSiman(
            original_id=row['id'],
            chapter_id=row['chapter_id'],
            assunto=assunto,
            assunto_resumido=assunto_resumido,
            categoria=categoria,
            tags=tags,
            seifim=seifim,
            confianca=confianca,
            palavras_chave=palavras_chave,
            tem_assunto_original=tem_assunto_original
        )

    def process_csv(self, csv_file: str) -> List[ProcessedSiman]:
        """Processa todo o CSV com algoritmo MELHORADO"""
        
        processed_simanim = []
        
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for i, row in enumerate(reader):
                if i % 100 == 0:
                    print(f"Processando linha {i}...")
                
                try:
                    processed = self.process_siman(row)
                    processed_simanim.append(processed)
                except Exception as e:
                    print(f"Erro ao processar linha {i}: {e}")
                    continue
        
        return processed_simanim

    def generate_sql(self, processed_simanim: List[ProcessedSiman]) -> str:
        """Gera SQL com todos os dados processados MELHORADOS"""
        
        sql_parts = []
        
        # INSERT para assuntos
        sql_parts.append("-- =====================================================")
        sql_parts.append("-- INSERÇÃO DOS ASSUNTOS PROCESSADOS (MELHORADOS)")
        sql_parts.append("-- =====================================================")
        
        for siman in processed_simanim:
            assunto_escaped = siman.assunto.replace("'", "''")
            assunto_resumido_escaped = siman.assunto_resumido.replace("'", "''")
            palavras_chave_str = "{" + ",".join([f'"{p}"' for p in siman.palavras_chave]) + "}"
            tipo = "original" if siman.tem_assunto_original else "gerado"
            
            sql = f"""
INSERT INTO assuntos (id, siman_id, divisao_id, assunto, assunto_resumido, tipo, confianca, palavras_chave) VALUES
('{uuid.uuid4()}', '{siman.original_id}', '{siman.chapter_id}', '{assunto_escaped}', '{assunto_resumido_escaped}', '{tipo}', {siman.confianca}, '{palavras_chave_str}');"""
            sql_parts.append(sql)
        
        # INSERT para seifim
        sql_parts.append("\n-- =====================================================")
        sql_parts.append("-- INSERÇÃO DOS SEIFIM PROCESSADOS")
        sql_parts.append("-- =====================================================")
        
        for siman in processed_simanim:
            for seif in siman.seifim:
                conteudo_escaped = seif['conteudo'].replace("'", "''")
                assunto_escaped = seif['assunto'].replace("'", "''")
                palavras_chave_str = "{" + ",".join([f'"{p}"' for p in seif['palavras_chave']]) + "}"
                
                sql = f"""
INSERT INTO seifim (id, siman_id, divisao_id, seif_numero, conteudo, assunto, palavras_chave, tamanho, ordem) VALUES
('{uuid.uuid4()}', '{siman.original_id}', '{siman.chapter_id}', {seif['numero']}, '{conteudo_escaped}', '{assunto_escaped}', '{palavras_chave_str}', {seif['tamanho']}, {seif['ordem']});"""
                sql_parts.append(sql)
        
        # INSERT para relacionamentos categoria
        sql_parts.append("\n-- =====================================================")
        sql_parts.append("-- INSERÇÃO DOS RELACIONAMENTOS CATEGORIA")
        sql_parts.append("-- =====================================================")
        
        for siman in processed_simanim:
            sql = f"""
INSERT INTO siman_categorias (id, siman_id, categoria_id, confianca) VALUES
('{uuid.uuid4()}', '{siman.original_id}', (SELECT id FROM categorias WHERE nome = '{siman.categoria}'), {siman.confianca});"""
            sql_parts.append(sql)
        
        # INSERT para relacionamentos tags
        sql_parts.append("\n-- =====================================================")
        sql_parts.append("-- INSERÇÃO DOS RELACIONAMENTOS TAGS")
        sql_parts.append("-- =====================================================")
        
        for siman in processed_simanim:
            for tag in siman.tags:
                sql = f"""
INSERT INTO siman_tags (id, siman_id, tag_id, relevancia) VALUES
('{uuid.uuid4()}', '{siman.original_id}', (SELECT id FROM tags WHERE nome = '{tag}'), 1.0);"""
                sql_parts.append(sql)
        
        return "\n".join(sql_parts)

def main():
    """Função principal MELHORADA"""
    
    print("Iniciando processamento MELHORADO do Shulchan Aruch com IA...")
    
    processor = ImprovedShulchanAruchProcessor()
    
    # Processa o CSV
    print("Lendo e processando CSV com algoritmo melhorado...")
    processed_simanim = processor.process_csv('csv/content_rows.csv')
    
    print(f"Processados {len(processed_simanim)} simanim")
    
    # Estatísticas
    originais = sum(1 for s in processed_simanim if s.tem_assunto_original)
    gerados = sum(1 for s in processed_simanim if not s.tem_assunto_original)
    
    print(f"Assuntos originais: {originais}")
    print(f"Assuntos gerados: {gerados}")
    
    # Gera SQL
    print("Gerando SQL melhorado...")
    sql_content = processor.generate_sql(processed_simanim)
    
    # Salva SQL
    with open('populated_data_improved.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print("Processamento MELHORADO concluido!")
    print("Arquivo 'populated_data_improved.sql' gerado com títulos específicos")
    
    # Estatísticas
    total_seifim = sum(len(s.seifim) for s in processed_simanim)
    total_tags = len(set(tag for s in processed_simanim for tag in s.tags))
    
    print(f"\nEstatisticas:")
    print(f"   - Simanim processados: {len(processed_simanim)}")
    print(f"   - Assuntos originais: {originais}")
    print(f"   - Assuntos gerados: {gerados}")
    print(f"   - Seifim extraidos: {total_seifim}")
    print(f"   - Tags unicas: {total_tags}")

if __name__ == "__main__":
    main()
