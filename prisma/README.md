# Prisma baseline (cheffia-front-app)

Estrutura inicial de banco para a migracao do backend:
- `schema.prisma`: modelos base multi-tenant
- `erd/diagram.md`: diagrama inicial em Mermaid

## Comandos uteis
```bash
bun run prisma:env:check
bun run prisma:gate
bun run prisma:validate
bun run prisma:format
bun run prisma:migrate -- --name init_backend_migration
bun run prisma:generate
bun run prisma:erd
```

Os scripts usam `prisma@6.16.3` via `bunx` para manter paridade com `lead-flow-app`.

`bun run prisma:env:check` valida `DATABASE_URL` e `DIRECT_URL` sem expor segredos, detectando placeholders e conflito entre `.env*`.

## Regras
- Toda tabela tenant-scoped deve incluir `tenant_id`.
- Endpoints de escrita devem usar `idempotency_keys`.
- Webhooks Asaas devem usar `asaas_webhook_events` para deduplicacao.
- Eventos de integracao/realtime devem sair por `outbox_events`.
