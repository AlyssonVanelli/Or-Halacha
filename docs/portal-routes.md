# Portal do Assinante — Estrutura de Rotas

## Rotas criadas

- `/portal`  
  Lista todos os livros publicados disponíveis para assinantes.

- `/portal/books/[bookId]`  
  Lista todos os capítulos publicados do livro selecionado.

- `/portal/books/[bookId]/chapters/[chapterId]`  
  Exibe o conteúdo do capítulo selecionado.

## Proteção de acesso

Todas as rotas do portal são protegidas pelo componente `SubscriberGuard`, que verifica se o usuário está autenticado e possui assinatura ativa na tabela `subscriptions`.

## Como expandir

- Adicione mais campos (ex: capa do livro, descrição do capítulo) conforme desejar.
- Para área administrativa, crie rotas sob `/dashboard/books`, `/dashboard/chapters`, etc.
- Para liberar conteúdos gratuitos, adapte o guardião para permitir acesso parcial.

---
