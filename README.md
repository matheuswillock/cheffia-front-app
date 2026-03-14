# Cheffia - Sistema de Gerenciamento de Pedidos

O Cheffia é uma solução completa para gerenciamento de pedidos, desenvolvida para melhorar a experiência do cliente e aumentar as vendas do seu estabelecimento. A plataforma oferece uma interface intuitiva e moderna para simplificar o processo de pedidos.

## 🌐 Deploy

O projeto está atualmente deployado na Vercel e pode ser acessado em: [cheffia.vercel.app](https://cheffia.vercel.app)

## 🚀 Começando

### Pré-requisitos

- Node.js 18.x ou superior
- npm, yarn ou pnpm
- bun

### Instalação

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/cheffia-front-app.git
cd cheffia-front-app
```

2. Instale as dependências
```bash
bun install
```

3. Inicie o servidor de desenvolvimento
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

## 📦 Estrutura do Projeto

O projeto usa App Router sem pasta `src/` e segue o fluxo arquitetural:

- Frontend: `page -> features -> container | context | services -> api`
- Backend: `route -> useCases -> services -> infra`

```
app/
  ├── (routes)/                         # páginas e layouts do App Router
  ├── api/
  │   ├── v1/**/route.ts                # endpoints HTTP
  │   ├── useCases/                     # orquestração dos casos de uso
  │   ├── services/                     # serviços de domínio e regras reutilizáveis
  │   └── infra/                        # adapters externos, storage, prisma, supabase
  └── */features/
      ├── container/                    # composição da feature
      ├── context/                      # estado e providers locais
      └── services/                     # integração da feature com api clients
api/                                    # clients consumidos pelo frontend
components/                             # componentes reutilizáveis
lib/                                    # utilitários compartilhados
models/                                 # contratos e DTOs
types/                                  # tipos auxiliares
utils/                                  # integrações utilitárias e validações
assets/                                 # recursos estáticos locais
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Contribuição

Contribuições são sempre bem-vindas! Por favor, leia o [guia de contribuição](CONTRIBUTING.md) primeiro.
