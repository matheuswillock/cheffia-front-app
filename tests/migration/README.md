# Migration Tests (Task 15)

Suite de regressao/seguranca da migracao backend v1.

## Comandos

```bash
bun run migration:baseline
bun run migration:baseline:full
bun run migration:baseline:strict
bun run test:migration
bun run test:migration:strict
bun run artifacts:check
```

## Escopos

- `contracts.openapi.test.mjs`
  - valida se `openapi.json` cobre todas as rotas/metodos migrados
  - valida headers de tenant e idempotencia documentados
- `runtime.e2e.test.mjs`
  - testes HTTP contra app rodando local/remoto
  - inclui cenarios de tenant context, idempotencia e replay de webhook
  - casos sensiveis dependem de variaveis de ambiente e sao pulados quando ausentes
  - `MIGRATION_E2E_REQUIRED=1` torna os cenarios obrigatorios (modo usado no CI de merge/deploy)

## Variaveis opcionais para E2E

- `MIGRATION_E2E_BASE_URL`
  - exemplo: `http://localhost:3000`
- `MIGRATION_E2E_TENANT_ID`
  - tenant valido para testes de idempotencia/webhook
- `MIGRATION_E2E_FOREIGN_SUPABASE_ID`
  - supabaseId de restaurante de outro tenant (teste cross-tenant)
- `MIGRATION_E2E_ASAAS_WEBHOOK_TOKEN`
  - token esperado pelo endpoint de webhook
- `MIGRATION_E2E_REQUIRED`
  - quando `1`, a suite falha se qualquer variavel obrigatoria do runtime E2E estiver ausente
