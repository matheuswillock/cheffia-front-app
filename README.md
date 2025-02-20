# Cheffia - Sistema de Gerenciamento de Pedidos

O Cheffia é uma solução completa para gerenciamento de pedidos, desenvolvida para melhorar a experiência do cliente e aumentar as vendas do seu estabelecimento. A plataforma oferece uma interface intuitiva e moderna para simplificar o processo de pedidos.

## 🌐 Deploy

O projeto está atualmente deployado na Vercel e pode ser acessado em: [cheffia.vercel.app](https://cheffia.vercel.app)

## 🚀 Começando

### Pré-requisitos

- Node.js 18.x ou superior
- npm, yarn ou pnpm

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

## 🛠️ Tecnologias Principais

- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)

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
