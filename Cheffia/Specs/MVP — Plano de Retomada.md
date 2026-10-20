# Cheffia — Plano de Retomada do MVP

**Status:** implementação incremental em andamento — Slice 3 entregue na branch `feature/order-kds-completion`, aguardando validação integral dos gates
**Data de atualização:** 2026-10-20
**Branch de integração:** `develop` · **branch da entrega Slice 3:** `feature/order-kds-completion`
**Stack alvo:** Next.js + Supabase + Prisma ORM 7 estável + Bun

## 1. Objetivo

Retomar o Cheffia como um produto full-stack para conectar mesa, cardápio e cozinha em um fluxo confiável:

```text
Assinatura Cheffia → onboarding → mesa/QR → cardápio → pedido → KDS → preparo → entrega opcional
```

O MVP deve provar o ciclo operacional antes de ampliar pagamentos, importação de cardápio, notificações ou delivery.

## 2. Stack e decisões irrevogáveis do MVP

- **Next.js** para aplicação, páginas e Route Handlers.
- **Bun** como runtime local/produção quando suportado pelo alvo e como único gerenciador de pacotes.
- **Supabase** para PostgreSQL, Auth, Storage e Realtime.
- **Prisma ORM 7.10.1**, última linha estável verificada; Prisma ORM 8 permanece release candidate e não será usado em produção neste slice.
- **Supabase Realtime Broadcast** como transporte realtime. Postgres Changes fica reservado para casos simples e administrativos.
- **Outbox persistente** como fonte dos eventos operacionais; Realtime é somente transporte/notificação.
- **Sem servidor WebSocket próprio** no MVP.
- **Sem npm, npx, yarn ou pnpm** em scripts, documentação operacional e CI. Os comandos oficiais são `bun`, `bunx` e a CLI `supabase`.

## 3. Escopo funcional

### Slice 0 — Fundação e assinatura

- Supabase Auth e sessão server-side.
- Assinatura Cheffia via AbacatePay, sem trial/cupons.
- Bloqueio operacional enquanto a assinatura não estiver confirmada.
- Grace period de inadimplência de 7 dias; depois, somente consulta.
- Owner/admin com MFA obrigatório; gestor com MFA opcional.
- Auditoria de ações sensíveis por restaurante, retida por cinco anos.

### Slice 1 — Onboarding e tenant

- Criação do restaurante e owner.
- Convites de equipe com validade de 48 horas, revogação e reenvio.
- Papéis: owner, gestor, cozinha e garçom.
- Isolamento por tenant em aplicação e RLS.
- Configuração mínima de operação: aceitar pedidos, modo de preparo e modo de entrega.

### Slice 2 — Catálogo e mesas

- Categorias, itens, disponibilidade manual e arquivamento.
- Modificadores reutilizáveis.
- Observação limitada por pedido/item.
- Mesas, QR assinado e rotação de QR sem invalidar sessões/tickets ativos.
- URL pública configurável como consulta ou pedido.

### Slice 3 — Pedido e KDS

- Sessão de mesa como fronteira de autorização do pedido público.
- Idempotência obrigatória na criação e em todas as transições de escrita.
- Snapshot imutável de item, preço, modificadores e observação no pedido confirmado.
- KDS FIFO por restaurante, com concorrência otimista e estados `pending → confirmed → preparing → ready → delivered`.
- A cozinha pode recusar em `pending` ou `confirmed`, obrigatoriamente com motivo.
- O cliente pode cancelar somente em `pending` ou `confirmed`; a partir de `preparing`, a API devolve erro explícito de regra de negócio.
- Entrega é do pedido inteiro; entrega por item não integra este MVP.

#### Contratos do Slice 3

- `POST /api/public/orders/:orderId/cancel` requer `Idempotency-Key` e os cabeçalhos da sessão de mesa; retorna `{ orderId, status, version }`.
- `POST /api/restaurants/:slug/orders/:orderId/transitions` requer sessão de membro ativo e `Idempotency-Key`; retorna o mesmo contrato.
- Repetir uma chave com o mesmo payload reproduz a resposta; reutilizá-la com payload distinto ou concorrer com outra escrita devolve conflito, sem duplicar transição ou evento.
- Realtime usa apenas canais privados: `order:<orderId>` para o cliente e `restaurant:<restaurantId>:orders` para a operação.
- Cada mensagem contém somente `eventId`, `sequence`, `eventType`, `orderId`, `status` e `version`. Broadcast é sinal de atualização: os consumidores deduplicam, detectam lacunas e recarregam o snapshot persistido.
- `postgres_changes` não é transporte do Slice 3.

#### Operação do outbox

- Toda criação ou mudança de estado grava o evento no mesmo commit do pedido.
- O publisher reivindica lotes com lease/fencing, publica ambos os tópicos privados e só então marca o evento como `published`.
- Falhas aplicam backoff; na décima tentativa o evento passa a `failed`, sem desfazer o pedido.
- `POST /api/internal/outbox/publish` exige `Authorization: Bearer $CRON_SECRET`; `vercel.json` agenda sua execução a cada minuto.
- `SUPABASE_SECRET_KEY` é exclusivo do publisher. Em E2E usa-se a chave do Supabase temporário; segredos de produção nunca entram em fixtures.

### Fora do primeiro MVP operacional

- Delivery.
- Importador CSV/Excel/link público com IA — será o próximo slice e já nascerá assíncrono.
- Split de pagamento de consumidor e repasse ao restaurante.
- Impressão automática, e-mail transacional e notificações de alto volume.
- Recuperação privada de ticket e rotação de QR (mantidas como trabalho posterior do Slice 2/operacional).
- Entrega por item.

## 4. Migrations e deploy do banco

### 4.1 Fonte de verdade

O banco terá uma única fonte de verdade de migrations:

1. `supabase/migrations/`: tabelas, colunas, enums, relações, índices, constraints, RLS, funções, triggers, Broadcast e Storage policies.
2. Prisma é somente o ORM/client e não mantém histórico de migrations.

Não manteremos duas migrations independentes para o mesmo objeto.

### 4.2 Fluxo local

1. Alterar o schema Prisma e a migration SQL Supabase na branch.
2. Gerar/revisar a migration Supabase.
3. Aplicar e testar localmente.
4. Revisar SQL, RLS, locks, operação destrutiva e compatibilidade backward.
5. Commitar migration, schema/config e testes.

Comandos de referência:

```bash
bun install
bun run prisma:validate
bun run prisma:generate
supabase migration new nome_da_mudanca
bun run db:reset
bun run db:verify
```

### 4.3 Fluxo de produção

Migrations **não** serão executadas no startup do Next.js. Em serverless, cada réplica poderia tentar migrar e uma falha de migration não deve deixar a aplicação parcialmente publicada.

O pipeline terá gates de qualidade e promoção por ambiente:

```text
feature/bugfix → develop → release → main → Supabase deploy + Vercel deploy
```

O Supabase GitHub Integration será o executor das migrations de produção na
`main`; GitHub Actions valida qualidade e o banco local, mas não aplica migrations
de produção. Prisma não executa migrations.
Como Vercel e o Supabase Integration reagem ao mesmo push, a aplicação deve ser
compatível com o schema anterior durante o rollout (`expand/contract`).

As credenciais de produção ficam gerenciadas pela integração do Supabase. Nenhum
valor real será versionado ou impresso em logs.

### 4.4 Regras de segurança operacional

- Produção nunca recebe alteração manual pelo Dashboard depois que o histórico estiver inicializado.
- `supabase migration list` é verificado nos ambientes locais antes de aplicar.
- Migrations destrutivas exigem migration de expansão, backfill, janela de remoção e validação explícita.
- Falhas de histórico devem ser corrigidas com `migration repair` somente após confirmar o estado real; nunca recriar migration já aplicada.
- A migration inicial será criada a partir do schema recuperado e auditado, não inventada a partir da `main` atual, que ainda não contém o schema.

## 5. Realtime

O caminho de escrita é:

```text
transação de domínio
  ├─ altera pedido/estado
  └─ grava outbox_event com event_id, tenant_id, aggregate_id e sequence
             ↓ commit
publisher com lease/retry → Supabase Broadcast privado
             ↓
KDS/menu/status do cliente → ressincronização no banco
```

O cliente deve:

- reconectar automaticamente;
- detectar mudança de sessão/canal;
- buscar o snapshot atual após reconexão, erro ou evento fora de ordem;
- deduplicar `event_id`;
- nunca tratar a mensagem realtime como fonte única da verdade.

Os canais devem ser `private: true` e protegidos por RLS em `realtime.messages`: a sessão só recebe o pedido associado a ela; o membro ativo só recebe o tópico do seu restaurante. O ambiente Supabase deve manter acesso público a canais desabilitado. O payload não deve conter segredo ou dados de outro tenant.

O hook WebSocket legado em `src/hooks/useWebSocket.ts` será removido/adaptado quando o slice KDS for implementado; ele não é base aceitável para o MVP.

## 6. Filas e trabalho assíncrono

### Decisão

Não provisionar Vercel Queues como dependência obrigatória do primeiro slice. Preparar o domínio para filas desde já, mas usar processamento síncrono somente onde o trabalho é curto e transacional.

### Não usar fila de produto no MVP inicial

- criação do pedido;
- transições do KDS;
- disponibilidade de item;
- leitura do cardápio;
- sessão de mesa;

O broadcast não bloqueia a escrita: ele é entregue pelo publisher interno do Outbox, agendado por Vercel Cron. Isso não introduz uma fila de produto nem muda a regra transacional do pedido.

Esses fluxos precisam de resposta imediata e consistência transacional. O Outbox garante persistência; Supabase Realtime garante entrega best-effort do sinal; a ressincronização garante correção.

### Preparar para fila desde o MVP

Implementar o contrato de evento e os campos que permitem futura entrega at-least-once:

- `event_id` único;
- `tenant_id`;
- `aggregate_type` e `aggregate_id`;
- `event_type` versionado;
- `payload` validado;
- `available_at`, `retry_count`, `published_at`, `last_error`, lease e fencing token;
- chave de idempotência no consumidor;
- correlação por `request_id`.

O publisher deve ser uma porta de aplicação, não uma chamada direta a Vercel Queues. Assim o transporte pode ser trocado por Vercel Queues, Supabase/pgmq ou worker dedicado sem alterar o domínio.

### Candidatos imediatos a fila

1. **Webhooks de pagamento:** validar e persistir rapidamente, deduplicar por provedor/evento e processar efeitos externos de forma reentrante.
2. **Importador de cardápio:** parsing, download de links, OCR/IA, imagens e alertas de confiança.
3. **E-mails e notificações:** qualquer campanha ou reenvio em lote.
4. **Impressão:** retry de impressoras indisponíveis sem bloquear o pedido.
5. **Reconciliação financeira:** polling, chargebacks, estornos e divergências.

Vercel Queues entrega pelo menos uma vez; portanto, todo consumidor terá idempotência. O MVP não dependerá de ordenação global da fila.

## 7. Fatias de implementação

1. **Fundação:** recuperar schema/migrations da branch migrada sem segredos, escolher baseline, atualizar Prisma estável, configurar Supabase CLI e integrações de CI/CD.
2. **Auth/assinatura:** Auth, owner, assinatura e bloqueios.
3. **Tenant/onboarding:** restaurante, papéis, convites e RLS.
4. **Catálogo:** menu, categorias, itens, modificadores e Storage.
5. **Mesa/QR:** sessões, QR assinado e link privado.
6. **Pedido:** idempotência, snapshots, regras de cancelamento e transições.
7. **Realtime/KDS:** outbox, Broadcast privado, reconexão, resync e FIFO.
8. **Hardening:** testes de concorrência, tenant isolation, replay, migrations, observabilidade e smoke tests.

Cada fatia deve entregar teste de aceitação e não deve deixar uma segunda implementação paralela do mesmo fluxo.

## 8. Gates antes de pagamentos digitais

- Sandbox do provedor aprovado.
- Webhook assinado, idempotente, replay-safe e reconciliável.
- Onboarding financeiro aprovado antes de liberar PIX/cartão.
- Estorno e chargeback registrados no ledger.
- Teste de concorrência para duas confirmações do mesmo pagamento.
- Runbook para falha de provedor, atraso de webhook e divergência de status.

## 9. Estado atual e próximos passos

O repositório já versiona Prisma, migrations Supabase, RLS, testes por camada e o fluxo QR → pedido → KDS. O Slice 3 foi implementado na branch indicada no cabeçalho e ainda depende da execução bem-sucedida de todos os gates em ambiente com Bun, Supabase CLI e Docker.

Próximos passos executáveis:

1. promover `feature/order-kds-completion` para `develop` após revisão e CI verde;
2. executar `bun run test`, `bun run test:components`, `bun run typecheck`, `bun run db:reset`, `bun run db:verify`, `bun run test:e2e`, `bun run test:e2e:local` e `bun run test:coverage`;
3. configurar `CRON_SECRET`, `SUPABASE_SECRET_KEY` e Broadcast privado no ambiente de deploy;
4. validar o backlog do Outbox em `/api/health` e o runbook de eventos presos antes da promoção para `main`;
5. retomar os itens explicitamente fora de escopo somente após o ciclo completo de pedido/KDS estar estável.
