# Or Halacha

Uma plataforma moderna, segura e escalável para estudo e consulta de Halachá (Lei Judaica).

## 🚀 Tecnologias

- [Next.js 14](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.io/)
- [Jest](https://jestjs.io/) e [React Testing Library](https://testing-library.com/)
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) (Airbnb Style Guide)

## 📋 Pré-requisitos

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Docker (opcional)

## 🔧 Instalação

1. Clone o repositório:

```bash
git clone https://github.com/AlyssonVanelli/Or-Halacha.git
cd Or-Halacha
```

2. Instale as dependências:

```bash
pnpm install
```

3. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

4. Configure as variáveis de ambiente no arquivo `.env`

5. Inicie o banco de dados (se aplicável):

```bash
# Exemplo para Supabase local
supabase start
```

6. Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes com cobertura
pnpm test:coverage
```

## 📦 Build

```bash
# Criar build de produção
pnpm build

# Iniciar servidor de produção
pnpm start
```

## 🔍 Linting e Formatação

```bash
# Verificar linting
pnpm lint

# Corrigir problemas de linting
pnpm lint:fix

# Verificar formatação
pnpm format:check

# Formatar código
pnpm format
```

## 📚 Estrutura do Projeto

```
├── app/                 # App Router do Next.js
├── components/          # Componentes React reutilizáveis
├── contexts/            # Contextos React
├── hooks/               # Custom hooks
├── lib/                 # Utilitários e configurações
├── public/              # Arquivos estáticos
├── styles/              # Estilos globais
├── types/               # Definições de tipos TypeScript
└── __tests__/           # Testes automatizados
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: minha nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Convenções de Commit

Este projeto segue o [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova feature
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação de código
- `refactor:` - Refatoração de código
- `test:` - Adição ou modificação de testes
- `chore:` - Tarefas de manutenção

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🔐 Segurança

- Nenhum dado sensível é armazenado no repositório
- Autenticação via Supabase Auth
- Validação de entrada e saída com Zod
- Proteção contra CSRF e XSS
- Headers de segurança configurados

## 🚀 Deploy

O projeto está configurado para deploy automático na Vercel. Cada push para a branch `main` gera um novo deploy.

## 📞 Suporte

Para suporte, envie um email para contato@or-halacha.com ou abra uma issue no GitHub.

## 🐳 Docker

### Desenvolvimento

Para iniciar o ambiente de desenvolvimento com Docker:

```bash
# Construir e iniciar os containers
docker-compose up

# Em outro terminal, para ver os logs
docker-compose logs -f

# Para parar os containers
docker-compose down
```

### Produção

Para executar em produção:

```bash
# Construir e iniciar o container de produção
docker-compose up app-prod

# Para parar
docker-compose down
```

### Comandos Úteis

```bash
# Reconstruir os containers após mudanças no Dockerfile
docker-compose build

# Executar comandos dentro do container
docker-compose exec app pnpm <comando>

# Ver logs de um serviço específico
docker-compose logs -f app

# Remover containers e volumes
docker-compose down -v
```

## 🛠️ Desenvolvimento com Dev Container

Este projeto inclui configuração para Dev Container do VSCode, que oferece um ambiente de desenvolvimento consistente e isolado.

### Pré-requisitos

- [VSCode](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extensão do VSCode

### Como usar

1. Clone o repositório
2. Abra o projeto no VSCode
3. Quando solicitado, clique em "Reopen in Container" ou use o comando `Remote-Containers: Reopen in Container` do VSCode
4. Aguarde a construção do container e instalação das dependências

O Dev Container já inclui:

- Node.js 18
- pnpm 8
- Extensões úteis do VSCode
- Configurações de formatação e linting
- Hot reload para desenvolvimento

### Comandos Úteis

```bash
# Iniciar o servidor de desenvolvimento
pnpm dev

# Executar testes
pnpm test

# Executar linting
pnpm lint

# Executar formatação
pnpm format
```
