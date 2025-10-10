# Guia de Tipografia - Or Halachá

Este documento define o sistema de tipografia padronizado para a plataforma Or Halachá.

## Fontes Utilizadas

### Fontes Principais

- **Inter** - Fonte sans-serif para interface e texto geral
- **Crimson Text** - Fonte serif para conteúdo religioso e citações
- **JetBrains Mono** - Fonte monospace para código

### Pesos Disponíveis

- **Inter**: 300, 400, 500, 600, 700, 800
- **Crimson Text**: 400, 600 (normal e itálico)
- **JetBrains Mono**: 400, 500, 600

## Sistema de Tipografia

### Hierarquia de Títulos

#### Display (text-display)

- **Uso**: Títulos principais da aplicação
- **Tamanho**: 2.25rem (36px)
- **Peso**: 700 (Bold)
- **Fonte**: Inter
- **Exemplo**: "Or Halachá" na página inicial

#### Heading 1 (text-heading-1)

- **Uso**: Títulos de seção principal
- **Tamanho**: 1.875rem (30px)
- **Peso**: 600 (Semi-bold)
- **Fonte**: Inter
- **Exemplo**: "Política de Compra"

#### Heading 2 (text-heading-2)

- **Uso**: Subtítulos importantes
- **Tamanho**: 1.5rem (24px)
- **Peso**: 600 (Semi-bold)
- **Fonte**: Inter
- **Exemplo**: "Informações Gerais"

#### Heading 3 (text-heading-3)

- **Uso**: Títulos de card ou seção
- **Tamanho**: 1.25rem (20px)
- **Peso**: 500 (Medium)
- **Fonte**: Inter
- **Exemplo**: "Tipos de Compra"

#### Heading 4 (text-heading-4)

- **Uso**: Títulos pequenos
- **Tamanho**: 1.125rem (18px)
- **Peso**: 500 (Medium)
- **Fonte**: Inter
- **Exemplo**: "Formas de Pagamento"

### Texto Corpo

#### Body Large (text-body-large)

- **Uso**: Texto principal destacado
- **Tamanho**: 1.125rem (18px)
- **Peso**: 400 (Normal)
- **Fonte**: Inter
- **Line-height**: 1.75 (relaxed)

#### Body (text-body)

- **Uso**: Texto padrão
- **Tamanho**: 1rem (16px)
- **Peso**: 400 (Normal)
- **Fonte**: Inter
- **Line-height**: 1.75 (relaxed)

#### Body Small (text-body-small)

- **Uso**: Texto secundário
- **Tamanho**: 0.875rem (14px)
- **Peso**: 400 (Normal)
- **Fonte**: Inter
- **Line-height**: 1.75 (relaxed)

### Elementos de Interface

#### Caption (text-caption)

- **Uso**: Texto de apoio, notas
- **Tamanho**: 0.75rem (12px)
- **Peso**: 400 (Normal)
- **Fonte**: Inter
- **Cor**: Cinza médio

#### Label (text-label)

- **Uso**: Labels de formulário
- **Tamanho**: 0.875rem (14px)
- **Peso**: 500 (Medium)
- **Fonte**: Inter

#### Button (text-button)

- **Uso**: Texto de botões
- **Tamanho**: 1rem (16px)
- **Peso**: 500 (Medium)
- **Fonte**: Inter

#### Button Small (text-button-small)

- **Uso**: Texto de botões pequenos
- **Tamanho**: 0.875rem (14px)
- **Peso**: 500 (Medium)
- **Fonte**: Inter

### Tipografia Especializada

#### Hebrew (text-hebrew)

- **Uso**: Texto em hebraico
- **Tamanho**: 1.125rem (18px)
- **Peso**: 400 (Normal)
- **Fonte**: Crimson Text
- **Direção**: RTL (right-to-left)

#### Quote (text-quote)

- **Uso**: Citações importantes
- **Tamanho**: 1.125rem (18px)
- **Peso**: 400 (Normal)
- **Fonte**: Crimson Text
- **Estilo**: Itálico

#### Citation (text-citation)

- **Uso**: Citações pequenas, referências
- **Tamanho**: 0.875rem (14px)
- **Peso**: 400 (Normal)
- **Fonte**: Crimson Text
- **Estilo**: Itálico

#### Code (text-code)

- **Uso**: Código inline
- **Tamanho**: 0.875rem (14px)
- **Peso**: 400 (Normal)
- **Fonte**: JetBrains Mono
- **Background**: Cinza claro

#### Code Block (text-code-block)

- **Uso**: Blocos de código
- **Tamanho**: 0.875rem (14px)
- **Peso**: 400 (Normal)
- **Fonte**: JetBrains Mono
- **Background**: Cinza muito claro
- **Padding**: 1rem
- **Border**: Sutil

## Componentes de Tipografia

### Uso com Componentes React

```tsx
import { Display, Heading1, Body, BodySmall } from '@/components/ui/typography'

// Título principal
<Display>Or Halachá</Display>

// Título de seção
<Heading1>Política de Compra</Heading1>

// Texto padrão
<Body>Este é um parágrafo de texto padrão.</Body>

// Texto pequeno
<BodySmall>Texto secundário ou de apoio.</BodySmall>
```

### Uso com Classes CSS

```tsx
// Usando classes diretamente
<h1 className="text-display">Título Principal</h1>
<h2 className="text-heading-1">Título de Seção</h2>
<p className="text-body">Parágrafo padrão</p>
<span className="text-caption">Nota pequena</span>
```

## Cores de Texto

### Hierarquia de Cores

- **text-gray-900**: Títulos principais (máximo contraste)
- **text-gray-800**: Títulos secundários
- **text-gray-700**: Texto principal
- **text-gray-600**: Texto secundário
- **text-gray-500**: Texto de apoio

### Cores Especiais

- **text-blue-600**: Links e elementos interativos
- **text-red-600**: Erros e alertas
- **text-green-600**: Sucesso e confirmações
- **text-yellow-600**: Avisos e destaques

## Responsividade

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Ajustes por Dispositivo

- **Mobile**: Redução de 10-15% no tamanho das fontes
- **Tablet**: Tamanhos padrão
- **Desktop**: Tamanhos padrão com possibilidade de aumento

## Acessibilidade

### Contraste

- Todos os textos seguem WCAG AA (contraste mínimo 4.5:1)
- Títulos principais: 7:1 (AAA)
- Texto padrão: 4.5:1 (AA)

### Legibilidade

- Line-height mínimo: 1.5
- Line-height recomendado: 1.75 (relaxed)
- Espaçamento entre parágrafos: 1rem

## Boas Práticas

### Do's ✅

- Use a hierarquia de títulos corretamente
- Mantenha consistência na escolha de fontes
- Use cores apropriadas para cada contexto
- Teste a legibilidade em diferentes dispositivos

### Don'ts ❌

- Não misture fontes desnecessariamente
- Não use tamanhos muito pequenos (< 14px)
- Não use contraste insuficiente
- Não quebre a hierarquia visual

## Exemplos de Uso

### Página de Login

```tsx
<Display className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
  Or Halachá
</Display>
<BodySmall>Plataforma de Estudo Haláchico</BodySmall>
```

### Card de Informação

```tsx
<Heading3>Tipos de Compra</Heading3>
<Body>Esta seção explica os diferentes tipos de compra disponíveis.</Body>
<BodySmall>Para mais informações, consulte nossa política completa.</BodySmall>
```

### Formulário

```tsx
<Label htmlFor="email">E-mail</Label>
<ButtonText>Enviar</ButtonText>
```

Este sistema garante consistência visual e melhor experiência do usuário em toda a plataforma.
