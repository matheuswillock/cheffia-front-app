# Cheffia - Sistema de Gerenciamento de Pedidos

O Cheffia é uma solução completa para gerenciamento de pedidos, desenvolvida para melhorar a experiência do cliente e aumentar as vendas do seu estabelecimento. A plataforma oferece uma interface intuitiva e moderna para simplificar o processo de pedidos.

## 🌐 Deploy

O projeto está atualmente deployado na Vercel e pode ser acessado em: [cheffia.vercel.app](https://cheffia.vercel.app)

## 🚀 Começando

### Pré-requisitos

- Bun 1.4+
- CLI do Supabase autenticada para desenvolvimento local e migrations
- Acesso às variáveis Supabase do ambiente (nunca versionar credenciais)

### Instalação

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/cheffia-front-app.git
cd cheffia-front-app
```

2. Instale as dependências com Bun
```bash
bun install
```

3. Configure o ambiente local
```bash
cp .env.example .env.local
supabase start
bun run db:reset
bun run db:verify
```

4. Inicie o servidor de desenvolvimento
```bash
bun run dev
```

O projeto estará disponível em [http://localhost:3000](http://localhost:3000)

### Instalação Global do shadcn

O `shadcn` é uma ferramenta para adicionar componentes de UI ao seu projeto de forma rápida e fácil.

1. Instale o `shadcn` globalmente usando o `bun`:
```bash
bun add -g shadcn@latest
```

2. Adicione o componente `dialog` ao seu projeto:
```bash
shadcn add dialog
```

## 🛠️ Tecnologias Principais

- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- Prisma ORM 7 para schema e migrations do domínio
- Bun para runtime e gerenciamento de pacotes

### Qualidade e migrations

```bash
bun run prisma:validate
bun run typecheck
bun run test
bun run test:components
bun run test:e2e
bun run lint
bun run build
```

O fluxo de branches é `feature/*` ou `bugfix/*` → `develop` → `main`. O GitHub
Actions executa qualidade e validação local de migrations/RLS. No merge em
`main`, a Supabase GitHub Integration aplica `supabase/migrations/`; a Vercel Git Integration publica a aplicação. Prisma é apenas o ORM/client. Migrations
nunca rodam no startup do Next.js. O job usa o secret protegido `DIRECT_URL` e
não imprime credenciais. Ao final dos gates, o CI abre automaticamente o PR para
`develop` ou `main`, conforme a branch de origem, sem duplicar PRs abertos.

Para habilitar as migrations automáticas, conecte o repositório ao Supabase
GitHub Integration, use `supabase/` como working directory e configure o deploy
de produção para `main`.
(`dcicvvxuzfdidaefwerq`). O deploy nativo de migrations do Supabase deve
permanecer desabilitado para evitar dois executores concorrentes.

## 📦 Estrutura do Projeto

O projeto segue a estrutura padrão do Next.js 15 com App Router, organizado da seguinte forma:

```
src/
  ├── app/          # Rotas e páginas
  ├── assets/       # recursos svg    
  ├── components/    # Componentes reutilizáveis
  ├── externalServices/    # Serviços com API externas
  ├── lib/          # Utilitários e configurações
  ├── models/          # Classes de modelos
  ├── services/          # Regras de negócios
  ├── types/          # Esquemas de modelos para formulários da aplicação
  ├── utils/       # Utilidades para serviços como supabase e validações de formulários
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Contribuição

Contribuições são sempre bem-vindas! Por favor, leia o [guia de contribuição](CONTRIBUTING.md) primeiro.
