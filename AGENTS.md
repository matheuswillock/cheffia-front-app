# Cheffia — instruções de desenvolvimento

## Testes e TDD

- Toda implementação nova deve começar por um teste que descreva o comportamento esperado.
- Todo bug deve começar por um teste de regressão **red** que reproduza o comportamento exato do problema.
- Depois do red, implementar a menor correção necessária e confirmar **green**.
- Refatorar somente depois do green e executar a suíte novamente.
- O teste do bug corrigido deve permanecer versionado permanentemente.
- Não aceitar correções sem teste, testes que validem apenas detalhes internos ou mocks que eliminem a fronteira que deveria ser validada.

## Camadas obrigatórias

- `bun test`: regras de domínio, validações, casos de uso e integrações de backend com Supabase local.
- Vitest + React Testing Library + user-event: componentes, hooks, formulários, estados de loading/erro/sucesso e acessibilidade do frontend.
- Playwright: fluxos E2E reais no Next.js, incluindo autenticação, onboarding, cardápio, carrinho, checkout, pedidos, cozinha e bloqueios de assinatura.
- Supabase local: migrations, RLS, autorização e isolamento por tenant.

Use testes unitários para regras rápidas, testes de integração para contratos entre camadas e Playwright para fluxos completos. Playwright e testes de componente são complementares; não substituir uma camada pela outra.

## Organização dos testes

```text
tests/
  unit/         # domínio e backend puro
  integration/  # API, Prisma, Supabase local e RLS
  components/   # React Testing Library
  e2e/          # Playwright
  regressions/  # bugs corrigidos, identificados por issue
```

## CI e segurança

- O CI deve executar `bun run test`, `bun run test:components` e `bun run test:e2e` antes do build/deploy.
- O job final do CI deve criar automaticamente PRs `feature/bugfix` → `develop` e `develop` → `main`, de forma idempotente.
- Testes de componentes, integração e E2E críticos devem ser gates de promoção.
- Testes não podem usar credenciais, dados ou serviços de produção.
- Mocks são permitidos somente nas fronteiras externas; o caminho interno deve ser validado com dependências reais ou Supabase local.
- Ao alterar comportamento, atualizar o teste no mesmo change set.

## Runtime e comandos

- Usar Bun para instalação e execução (`bun`, `bunx`); não usar npm, npx, yarn ou pnpm.
- Não executar migrations no startup da aplicação.
- Antes de declarar uma tarefa concluída, executar os testes afetados e os gates relevantes do CI.
