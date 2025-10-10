# Or Halacha

## Visão Geral

Or Halacha é uma plataforma SaaS para estudo e consulta de Halachá (Lei Judaica), com biblioteca digital, busca avançada, autenticação segura e experiência moderna.

## Funcionalidades

- 🔍 Busca avançada em livros
- 📚 Biblioteca digital
- 👥 Sistema de usuários com Supabase Auth
- 🔒 Autenticação segura
- 🌐 Internacionalização
- 📱 Design responsivo
- 🚀 Deploy automático na Vercel

## Requisitos

- Node.js 18+
- pnpm 8+
- Supabase
- Stripe (para pagamentos)

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/AlyssonVanelli/Or-Halacha.git
cd Or-Halacha
```

2. Instale as dependências:

```bash
pnpm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

4. Configure o Supabase:

- Crie um projeto no Supabase
- Copie as credenciais para o arquivo .env

5. Configure o Stripe (opcional):

- Crie uma conta no Stripe
- Copie as chaves para o arquivo .env

6. Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

## Estrutura do Projeto

```
Or-Halacha/
├── app/                 # Rotas e páginas
├── components/          # Componentes React
├── contexts/            # Contextos React
├── hooks/               # Hooks personalizados
├── lib/                 # Bibliotecas e utilitários
├── public/              # Arquivos estáticos
├── styles/              # Estilos globais
├── types/               # Tipos TypeScript
└── __tests__/           # Testes automatizados
```

## Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes com cobertura
pnpm test:coverage
```

## Segurança

- Autenticação Supabase Auth
- Proteção contra XSS e CSRF
- Validação de entrada com Zod
- Headers de segurança

## Performance

- Otimização de imagens (Next.js Image)
- Lazy loading
- Code splitting
- Caching
- CDN (Vercel)

## Manutenção

- Deploy contínuo (Vercel)
- Monitoramento de erros
- Logs de acesso
- Métricas de performance

## Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](../LICENSE) para detalhes.

## Suporte

Para suporte, envie um email para contato@or-halacha.com ou abra uma issue no GitHub.
