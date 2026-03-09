# Supabase + Prisma Setup (baseline)

Este documento define a configuracao minima para conectar o backend migrado ao Supabase Postgres usando Prisma.

## 1) Identificacao do projeto
- Supabase Project ID: `zhtlkgobqilvuzoeugct`
- Regiao pooler: `aws-1-sa-east-1`

## 2) Variaveis de ambiente obrigatorias
Use um arquivo local (nao versionado) e configure os mesmos valores como secrets no GitHub Actions e na Vercel.

```bash
# Supabase project
SUPABASE_PROJECT_ID="zhtlkgobqilvuzoeugct"

# Credencial de banco (nao commitar no git)
SUPABASE_DB_PASSWORD="PodGiuNTglwO7pke"

# Pooling connection (runtime da aplicacao)
DATABASE_URL="postgresql://postgres.zhtlkgobqilvuzoeugct:${SUPABASE_DB_PASSWORD}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (migrations)
DIRECT_URL="postgresql://postgres.zhtlkgobqilvuzoeugct:${SUPABASE_DB_PASSWORD}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"

# Supabase SDK (frontend/server auth quando necessario)
NEXT_PUBLIC_SUPABASE_URL="https://zhtlkgobqilvuzoeugct.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<<preencher>>"
SUPABASE_SERVICE_ROLE_KEY="<<somente backend seguro>>"

# Storage (Task 11 - menu media)
SUPABASE_STORAGE_MENU_BUCKET="cheffia-menu-media"
```

## 3) Scripts Prisma disponiveis
No `package.json`:
- `bun run prisma:env:check`
- `bun run prisma:gate`
- `bun run prisma:validate`
- `bun run prisma:format`
- `bun run prisma:generate`
- `bun run prisma:migrate`
- `bun run prisma:migrate:deploy`
- `bun run prisma:migrate:status`
- `bun run prisma:studio`
- `bun run prisma:erd`

Obs: os scripts estao fixados em `prisma@6.16.3` para manter compatibilidade com o padrao do `lead-flow-app`.

## 4) Sequencia basica de bootstrap
```bash
bun run prisma:env:check
bun run prisma:gate
bun run prisma:validate
bun run prisma:format
bun run prisma:migrate -- --name init_backend_migration
bun run prisma:generate
bun run prisma:erd
```

Notas do preflight:
- `bun run prisma:env:check` nao imprime segredos; ele apenas confirma presenca de `DATABASE_URL`/`DIRECT_URL`, detecta placeholders (`[YOUR-PASSWORD]`, `<<preencher>>`, `replace_me`, etc.) e acusa conflito entre `.env`, `.env.local`, `.env.development` e `process.env`.
- `bun run prisma:gate` executa o preflight acima e, em seguida, roda `bun run prisma:validate`.

Arquivos iniciais criados nesta migracao:
- `prisma/migrations/20260304160000_init_multi_tenant_baseline/migration.sql`
- `supabase/policies/20260304160500_multi_tenant_rls.sql`
- `supabase/storage-policies.sql`

Aplicacao das policies RLS:
1. Executar migrations Prisma (local/CI).
2. Abrir Supabase SQL Editor do projeto.
3. Rodar `supabase/policies/20260304160500_multi_tenant_rls.sql`.
4. Rodar `supabase/storage-policies.sql`.

## 5) Regras obrigatorias para migracao
- Toda tabela de dominio deve ter `tenant_id`.
- Chaves unicas compostas devem incluir `tenant_id` quando a entidade for tenant-scoped.
- RLS deve ser habilitado no Supabase para tabelas tenant-scoped.
- `SUPABASE_SERVICE_ROLE_KEY` so pode ser usada em server-side seguro (Route Handlers internos).
- Webhook Asaas deve gravar evento bruto e aplicar deduplicacao por `(tenant_id, provider, provider_event_id)`.

## 6) Teste local de webhook (ngrok)
Use o fluxo ja documentado em:
- `migração backend/NGROK_WEBHOOK_LOCAL.md`

Resumo rapido:
```bash
bun run dev
bun run ngrok:webhook
bun run webhook:local:url
```
