# MIGRATION_TODO.md

Objetivo: migrar o backend atual (.NET) para Route Handlers no Next.js dentro do `cheffia-front-app`, com Supabase (DB + Storage), Asaas e deploy na Vercel.

Decisao de realtime adotada: **Opcao 1 - Supabase Realtime + Outbox de eventos**.

## Fluxo de branches obrigatorio
1. Branch base de migracao: `migration-backend` (criada a partir de `develop`).
2. Cada nova task deve nascer de `migration-backend` com padrao local:
`feature/<nome-da-task-em-kebab-case>`.
3. A branch `feature/*` e usada para desenvolvimento local da task.
4. O push remoto deve ser feito sempre para `migration-backend` (nunca para `feature/*`).
5. Fluxo remoto oficial: `migration-backend` -> `develop` -> `main`.

Comandos de referencia:
```bash
# criar branch de task a partir da base
git checkout migration-backend
git pull
git checkout -b feature/nome-da-task

# desenvolver e commitar na feature
git add .
git commit -m "feat: nome da task"

# integrar localmente e publicar somente migration-backend
git checkout migration-backend
git merge --no-ff feature/nome-da-task
git push origin migration-backend
```

- [x] 01. Preparar estrutura de backend no app Next
Definicao de pronto: estrutura `src/app/api/v1/cheffia/**` criada com pastas por dominio (`Restaurant`, `Menu`, `MenuLive`, `OrderHub`, `Payment`) sem quebrar o frontend atual.
Arquivos/paths envolvidos: `src/app/api/v1/cheffia/**`, `src/server/**`.
Riscos/observacoes: conflitos com codigo legado em `src/api/**`.
Nota multi-tenant/idempotencia: toda nova rota deve nascer com `TenantContext` e suporte a idempotencia quando houver escrita.

- [x] 02. Congelar contratos da API v1 atual
Definicao de pronto: lista completa de rotas, metodos, inputs e outputs documentada e validada contra o backend atual.
Arquivos/paths envolvidos: `migração backend/api-routes.md`, `src/server/contracts/v1/**`.
Riscos/observacoes: divergencias entre comportamento real e contratos esperados pelo frontend.
Nota multi-tenant/idempotencia: marcar em cada rota se exige tenant obrigatorio e se exige `Idempotency-Key`.

- [x] 03. Implementar envelope de resposta compativel
Definicao de pronto: utilitario `Output<T>` no backend TS retornando `isValid`, `successMessages`, `errorMessages`, `result`.
Arquivos/paths envolvidos: `src/server/shared/output.ts`.
Riscos/observacoes: regressao em telas que dependem da estrutura atual de erro/sucesso.
Nota multi-tenant/idempotencia: incluir `requestId` e `tenantId` nos logs de erro para rastreio de tentativas repetidas.

- [ ] 04. Definir e implementar TenantContext obrigatorio
Definicao de pronto: helper resolve `tenantId` por request (JWT claim, recurso, ou resolucao segura por `restaurantId`) e bloqueia chamadas sem tenant.
Arquivos/paths envolvidos: `src/server/shared/tenant/**`, middlewares/helpers de rotas.
Riscos/observacoes: rotas publicas podem introduzir bypass se resolver tenant de forma insegura.
Nota multi-tenant/idempotencia: nenhum use case executa sem `ctx.tenantId`.

- [ ] 05. Modelar schema multi-tenant no Supabase com Prisma (configuracao base obrigatoria)
Definicao de pronto: `prisma/schema.prisma` criado com datasource Supabase (`DATABASE_URL` pooler + `DIRECT_URL` para migration), modelos iniciais com `tenant_id`, indices por tenant, suporte a idempotencia e webhook; politicas RLS aplicadas no banco.
Arquivos/paths envolvidos: `prisma/schema.prisma`, `prisma/migrations/**`, `prisma/erd/diagram.md`, `migração backend/SUPABASE_PRISMA_SETUP.md`, `supabase/policies/**`.
Riscos/observacoes: nao commitar senha do banco no git; risco de bloqueio por RLS mal configurada e divergencia entre Prisma migrations e SQL manual no Supabase.
Nota multi-tenant/idempotencia: isolamento por `tenant_id` em todas as tabelas criticas (`idempotency_keys`, `asaas_webhook_events`, `outbox_events`) com chaves unicas compostas.

Parametros Supabase desta migracao:
- `SUPABASE_PROJECT_ID=zhtlkgobqilvuzoeugct`
- Database password (usar somente em secrets locais/CI/Vercel; nao commitar): `PodGiuNTglwO7pke`
- `DATABASE_URL="postgresql://postgres.zhtlkgobqilvuzoeugct:[YOUR-PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"`
- `DIRECT_URL="postgresql://postgres.zhtlkgobqilvuzoeugct:[YOUR-PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"`

- [ ] 06. Criar modulo de idempotencia generico
Definicao de pronto: tabela e helper para registrar/reusar respostas por `Idempotency-Key` em endpoints de escrita.
Arquivos/paths envolvidos: `supabase/migrations/**`, `src/server/shared/idempotency/**`.
Riscos/observacoes: colisao de chave com payload diferente e expiracao de chaves antigas.
Nota multi-tenant/idempotencia: chave unica por `tenant_id + endpoint + method + idempotency_key`.

- [ ] 07. Implementar cliente Asaas centralizado
Definicao de pronto: cliente HTTP tipado para Asaas com timeout, retries controlados, logs seguros e mapeamento de erros.
Arquivos/paths envolvidos: `src/server/infra/external/asaas/**`.
Riscos/observacoes: diferencas de ambiente sandbox/producao e erros de configuracao de token.
Nota multi-tenant/idempotencia: toda chamada externa deve carregar correlacao (`requestId`, `tenantId`).

- [ ] 08. Implementar webhook Asaas seguro + idempotente
Definicao de pronto: webhook valida token/assinatura/origem, persiste payload bruto + headers, deduplica evento e processa de forma reentrante.
Arquivos/paths envolvidos: `src/app/api/v1/cheffia/OrderHub/webhook/asaas/route.ts`, `src/server/application/webhooks/**`, `supabase/migrations/**`.
Riscos/observacoes: eventos duplicados, fora de ordem, ou com atraso.
Nota multi-tenant/idempotencia: `unique(tenant_id, provider, provider_event_id)` e processamento exactly-once logico.

- [ ] 09. Migrar vertical slice Restaurant
Definicao de pronto: rotas `GET /Restaurant/{supabaseId}`, `POST /Restaurant/register`, `GET /Restaurant/confirm-email`, `DELETE /Restaurant/{id}/delete` funcionando em Next.
Arquivos/paths envolvidos: `src/app/api/v1/cheffia/Restaurant/**`, `src/server/application/restaurant/**`.
Riscos/observacoes: diferenca de serializacao e validacao entre .NET e TS.
Nota multi-tenant/idempotencia: validacao de tenant em leitura/escrita e idempotencia em operacoes que possam repetir.

- [ ] 10. Migrar vertical slice Menu + MenuLive
Definicao de pronto: `items/add`, `items/delete/{id}`, `get`, `MenuLive` migrados com contratos compativeis.
Arquivos/paths envolvidos: `src/app/api/v1/cheffia/Menu/**`, `src/app/api/v1/cheffia/MenuLive/**`, `src/server/application/menu/**`.
Riscos/observacoes: upload multipart e relacionamento categoria/item.
Nota multi-tenant/idempotencia: filtros obrigatorios por tenant no CRUD de menu.

- [ ] 11. Substituir Cosmic por Supabase Storage
Definicao de pronto: upload/remocao de imagens via Supabase Storage com namespace por tenant (`tenant/{tenantId}/...`).
Arquivos/paths envolvidos: `src/server/infra/storage/**`, `supabase/storage-policies.sql` (ou migrations equivalentes).
Riscos/observacoes: migracao de imagens existentes e links legados.
Nota multi-tenant/idempotencia: acesso ao bucket restrito por tenant e operacoes de upload seguras para retry.

- [ ] 12. Migrar vertical slice OrderHub + Payment
Definicao de pronto: rotas `send`, `order`, `payment`, `payment/confirmation`, `Payment/intent/create`, `Payment/product/create` migradas.
Arquivos/paths envolvidos: `src/app/api/v1/cheffia/OrderHub/**`, `src/app/api/v1/cheffia/Payment/**`, `src/server/application/orderhub/**`, `src/server/application/payments/**`.
Riscos/observacoes: comportamento atual depende de WebSocket e AbacatePay.
Nota multi-tenant/idempotencia: confirmacoes de pagamento e alteracoes de status devem ser idempotentes.

- [ ] 13. Implementar realtime com Supabase Realtime + Outbox (Opcao 1)
Definicao de pronto: atualizacoes de pedidos/kitchen chegam no frontend via canais Realtime por tenant/restaurant, sem servidor WebSocket proprio.
Arquivos/paths envolvidos: `src/server/application/events/**`, `src/server/infra/realtime/**`, hooks frontend em `src/hooks/**`.
Riscos/observacoes: ordem de eventos e reconexao do cliente.
Nota multi-tenant/idempotencia: eventos com `event_id` unico e `tenant_id`, consumo seguro a duplicidade.

- [ ] 14. Criar OpenAPI da nova API v1 e gerar collections
Definicao de pronto: `openapi.json` atualizado e script de geracao para Postman/Insomnia funcionando.
Arquivos/paths envolvidos: `src/server/openapi/**`, `scripts/generate-openapi.ts`, `postman/**`.
Riscos/observacoes: drift entre implementacao e documentacao.
Nota multi-tenant/idempotencia: documentar headers obrigatorios (`tenant`, `Idempotency-Key`) por rota.

- [ ] 15. Testes de regressao e seguranca de migracao
Definicao de pronto: testes cobrindo contratos v1, isolamento multi-tenant, duplicidade de webhook e retries.
Arquivos/paths envolvidos: `tests/**` (ou `src/**/__tests__/**`), pipeline CI.
Riscos/observacoes: falso positivo sem fixtures proximas do real.
Nota multi-tenant/idempotencia: casos obrigatorios de vazamento cross-tenant e replay de evento.

- [ ] 16. Deploy Vercel + hardening
Definicao de pronto: deploy preview/producao com env vars corretas, observabilidade e runbook de incidentes.
Arquivos/paths envolvidos: `migração backend/vercel-deploy.md` (futuro), configuracoes da Vercel.
Riscos/observacoes: timeout de functions, cold starts e secrets incorretos.
Nota multi-tenant/idempotencia: smoke tests pos-deploy validando RLS e deduplicacao de webhook.

- [ ] 17. Implementar fluxo CI/CD no padrao do `lead-flow-app/.github`
Definicao de pronto: workflows criados e ativos para `feature/**`, `bugfix/**`, `develop` e `main`, com quality gate (lint/typecheck/build), automacao de PR e deploy Vercel preview/producao.
Arquivos/paths envolvidos: `.github/workflows/ci-feature.yml`, `.github/workflows/ci-bugfix.yml`, `.github/workflows/ci-migration-backend.yml`, `.github/workflows/ci-develop.yml`, `.github/workflows/ci-main.yml`, `.github/pull_request_template.md`.
Riscos/observacoes: secrets ausentes (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, etc.), loops com bump de versao e triggers de branch incorretos.
Nota multi-tenant/idempotencia: o quality gate deve incluir testes obrigatorios de isolamento por tenant e replay idempotente de webhook antes de permitir merge/deploy.

- [ ] 18. Configurar e validar ngrok para webhook local (Asaas)
Definicao de pronto: tunel ngrok operacional para `localhost:3000`, URL publica do webhook gerada por script, endpoint recebendo webhook em ambiente local e evidencia de teste registrada.
Arquivos/paths envolvidos: `package.json`, `scripts/print-ngrok-webhook-url.mjs`, `migração backend/NGROK_WEBHOOK_LOCAL.md`, `src/app/api/v1/cheffia/OrderHub/webhook/asaas/route.ts` (quando implementado).
Riscos/observacoes: URL do ngrok muda a cada reinicio (plano free), falhas por tunel fechado e configuracao incorreta de token no provedor.
Nota multi-tenant/idempotencia: testes locais de webhook devem incluir evento duplicado para validar deduplicacao e resolucao correta de `tenant_id`.

---

## Ordem recomendada de execucao incremental
1. Itens 01 a 06 (fundacao tecnica).
2. Item 18 (ngrok local para acelerar ciclo de teste de webhook).
3. Itens 07 e 08 (Asaas + webhook idempotente).
4. Itens 09 a 13 (migracao por vertical slice + realtime Supabase).
5. Itens 14 e 15 (OpenAPI e testes de regressao).
6. Item 17 (CI/CD completo no padrao do lead-flow-app).
7. Item 16 (deploy/hardening final em producao).

## Instrucoes rapidas de ngrok (dentro do TODO)
1. Iniciar app local:
```bash
bun run dev
```
2. Abrir tunel:
```bash
bun run ngrok:webhook
```
3. Obter URL publica completa do webhook:
```bash
bun run webhook:local:url
```
4. Configurar no Asaas a URL retornada (metodo `POST`).
5. Validar recebimento local no endpoint:
`/api/v1/cheffia/OrderHub/webhook/asaas`.
6. Reenviar mesmo evento para validar idempotencia (resposta 2xx sem duplicar efeito de negocio).
