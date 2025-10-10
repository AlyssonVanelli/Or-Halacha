# Página de FAQ - Perguntas Mais Frequentes

## Visão Geral

A página de FAQ foi criada para responder às perguntas mais frequentes sobre Halachá e Judaísmo, baseada no conteúdo do arquivo `site.txt` da raiz do projeto. Esta página ajuda a reduzir consultas desnecessárias no WhatsApp e fornece respostas baseadas em fontes tradicionais.

## Localização

- **Rota**: `/faq`
- **Arquivo**: `app/faq/page.tsx`
- **Navegação**: Disponível no header principal e no dashboard

## Estrutura da Página

### Componentes Principais

1. **Header com título e descrição**
2. **Accordion de perguntas** com:
   - Pergunta principal
   - Resposta detalhada
   - Contexto das fontes (quando aplicável)
   - Erros comuns (quando aplicável)
   - Referências bibliográficas

### Perguntas Incluídas

1. **A morte de um tzadik expia pecados?**
2. **"Dízimo" vale para qualquer renda?**
3. **Ler os korbanot = oferecer sacrifício?**
4. **Pêssach — Qual o dia do korban e qual o dia de comer?**
5. **Sem sacrifícios no exílio = sem perdão/salvação?**
6. **Messias segundo a Torá**
7. **"Rasgou-se o véu do Santo dos Santos?"**
8. **Salmo 118:22 — "A pedra que os construtores rejeitaram…"**

## Funcionalidades

### Design Responsivo

- Layout adaptável para desktop e mobile
- Accordion interativo com animações suaves
- Cores e tipografia consistentes com o design system

### Navegação

- Link adicionado no header principal (`HeaderSimplificado`)
- Link adicionado no dashboard (`DashboardHeader`)
- Ícone de mensagem (MessageCircle) para identificação visual

### Acessibilidade

- Navegação por teclado
- Screen reader friendly
- Contraste adequado
- Foco visível nos elementos interativos

## Tecnologias Utilizadas

- **Next.js 14** com App Router
- **React** com hooks (useState)
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **TypeScript** para tipagem

## Estrutura de Dados

```typescript
type FaqItem = {
  id: string
  question: string
  answer: string
  context?: string
  commonErrors?: string[]
  references?: string[]
}
```

## Estilos Aplicados

### Cores

- **Background**: Gradiente de slate-50 para slate-100
- **Cards**: Branco com bordas sutis
- **Contexto**: Azul claro (blue-50)
- **Erros**: Âmbar claro (amber-50)
- **Referências**: Cinza claro (slate-50)

### Tipografia

- **Título principal**: text-4xl font-bold
- **Perguntas**: text-lg font-semibold
- **Respostas**: text-slate-700 leading-relaxed

### Espaçamento

- **Container**: max-w-4xl com padding responsivo
- **Cards**: Espaçamento interno de px-6 py-4
- **Seções**: space-y-4 para separação vertical

## Integração com o Sistema

### Navegação

A página está integrada ao sistema de navegação principal:

1. **Header Principal** (`HeaderSimplificado`):

   - Link "FAQ" na navegação desktop
   - Disponível para usuários não logados

2. **Dashboard Header** (`DashboardHeader`):
   - Botão FAQ no header desktop
   - Link FAQ no menu mobile
   - Disponível para usuários logados

### Roteamento

- Rota: `/faq`
- Acessível publicamente (não requer autenticação)
- SEO friendly com meta tags apropriadas

## Manutenção

### Adicionando Novas Perguntas

Para adicionar novas perguntas, edite o array `FAQS` em `app/faq/page.tsx`:

```typescript
const FAQS: FaqItem[] = [
  // ... perguntas existentes
  {
    id: 'nova-pergunta',
    question: 'Sua pergunta aqui?',
    answer: 'Resposta detalhada...',
    context: 'Contexto das fontes...',
    commonErrors: ['Erro comum 1', 'Erro comum 2'],
    references: ['Referência 1', 'Referência 2'],
  },
]
```

### Atualizando Conteúdo

- Edite diretamente o array `FAQS`
- Mantenha a estrutura de dados consistente
- Teste a responsividade após mudanças

## Performance

- **Lazy Loading**: Componente carregado apenas quando necessário
- **Otimização**: Uso de useState para controle de estado local
- **Bundle Size**: Mínimo impacto no tamanho do bundle

## Testes

Para testar a funcionalidade:

1. Acesse `/faq` no navegador
2. Verifique se todas as perguntas são exibidas
3. Teste o accordion (abrir/fechar)
4. Verifique a responsividade em diferentes tamanhos de tela
5. Teste a navegação a partir do header

## Próximos Passos

- [ ] Adicionar busca/filtro de perguntas
- [ ] Implementar analytics para perguntas mais acessadas
- [ ] Adicionar sistema de feedback para respostas
- [ ] Integrar com sistema de suporte para perguntas não respondidas
