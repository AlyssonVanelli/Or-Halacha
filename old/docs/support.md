# Sistema de Suporte

Este documento descreve o sistema de suporte implementado para a plataforma Or Halacha.

## Visão Geral

O sistema de suporte permite que usuários autenticados enviem mensagens para a equipe de suporte através de um formulário web. O sistema inclui:

- Validação de mensagens
- Notificação por e-mail
- Armazenamento no banco de dados
- Interface responsiva
- Feedback em tempo real

## Componentes

### Frontend

- `app/support/page.tsx`: Página principal do suporte
- `hooks/useSupportForm.ts`: Hook personalizado para gerenciar o estado do formulário
- `types/support.ts`: Definições de tipos TypeScript
- `constants/support.ts`: Constantes e mensagens do sistema

### Backend

- `app/api/support/create-request/route.ts`: API para criar pedidos de suporte
- Banco de dados: Tabela `support_requests` no Supabase

## Fluxo de Dados

1. Usuário acessa a página de suporte
2. Sistema verifica autenticação
3. Usuário preenche e envia o formulário
4. Frontend valida os dados
5. Backend processa a requisição:
   - Valida autenticação
   - Valida dados
   - Salva no banco
   - Envia e-mail
6. Frontend mostra feedback ao usuário

## Validações

### Frontend

- Mensagem deve ter entre 10 e 2000 caracteres
- Usuário deve estar autenticado
- Formulário não pode ser enviado durante processamento

### Backend

- Token de autenticação válido
- Mensagem dentro dos limites
- Dados do usuário válidos

## Banco de Dados

Tabela `support_requests`:

```sql
create table support_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  email text not null,
  message text not null,
  status text not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  response text
);
```

## E-mail de Notificação

O sistema envia um e-mail para a equipe de suporte contendo:

- E-mail do usuário
- Nome do usuário
- Data e hora
- Mensagem completa

## Testes

O sistema inclui testes automatizados para:

- Componente de suporte
- Hook useSupportForm
- API de criação de pedidos
- Validações
- Fluxos de erro

## Segurança

- Autenticação obrigatória
- Validação de dados
- Proteção contra CSRF
- Rate limiting
- Sanitização de inputs

## Manutenção

### Logs

O sistema registra logs para:

- Erros de autenticação
- Falhas no banco de dados
- Erros no envio de e-mail
- Erros de validação

### Monitoramento

Recomenda-se monitorar:

- Taxa de sucesso das requisições
- Tempo de resposta
- Erros de validação
- Falhas no envio de e-mail

## Próximos Passos

1. Implementar sistema de resposta
2. Adicionar histórico de pedidos
3. Melhorar interface administrativa
4. Implementar notificações em tempo real
5. Adicionar suporte a anexos
