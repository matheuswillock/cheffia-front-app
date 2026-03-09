# IFOOD_INTEGRATION_TODO.md

Objetivo: implementar a integracao iFood como proxima feature da Cheffia, no contexto do `cheffia-front-app`, permitindo vincular merchants do iFood a restaurantes da plataforma, sincronizar catalogo, receber eventos com seguranca e operar pedidos FOOD dentro do Order Hub atual.

Decisao de integracao adotada: **Aplicativo centralizado + Webhook primario + Polling de reconciliacao/contingencia**.

Decisao de catalogo adotada: **Importacao inicial do catalogo do iFood para a Cheffia no MVP**. Publicacao bidirecional completa fica fora desta primeira entrega.

## Fluxo de branches obrigatorio
1. Branch base da feature: `develop`.
2. Cada nova task deve nascer de `develop` com padrao local:
`feature/ifood-<nome-da-task-em-kebab-case>`.
3. A branch `feature/*` e usada para desenvolvimento local da task.
4. O fluxo remoto oficial desta frente: `develop` -> `main`.
5. Se a migracao backend ainda nao tiver sido mergeada em `develop`, usar `migration-backend` como base temporaria e rebasear antes do merge final.

Comandos de referencia:
```bash
# criar branch de task a partir da base
git checkout develop
git pull
git checkout -b feature/ifood-nome-da-task

# desenvolver e commitar na feature
git add .
git commit -m "feat: ifood nome da task"

# publicar branch da task
git push -u origin feature/ifood-nome-da-task
```

- [ ] 01. Consolidar acessos, credenciais e escopo oficial do app iFood
Definicao de pronto: app iFood identificado no Developer Portal com modulos `Authentication`, `Merchant`, `Catalog`, `Order` e `Events`; modelo de autenticacao centralizado confirmado; estrategia de homologacao FOOD documentada; variaveis de ambiente nomeadas para `IFOOD_CLIENT_ID`, `IFOOD_CLIENT_SECRET`, `IFOOD_BASE_URL`, `IFOOD_AUTH_URL`, `IFOOD_WEBHOOK_SECRET` e `IFOOD_WEBHOOK_URL`.
Arquivos/paths envolvidos: `migração backend/IFOOD_INTEGRATION_TODO.md`, `.env`, `.env.local`, futuro `src/server/infra/external/ifood/config.ts`.
Riscos/observacoes: uso de conta nao profissional/CNPJ bloqueia homologacao; escopos errados ou acessos pendentes por merchant geram `403`; nao expor `client_secret`.
Nota multi-tenant/idempotencia: as credenciais do app sao centralizadas, mas a autorizacao de uso dos dados dos merchants precisa ser refletida por tenant/restaurante e nunca compartilhada entre tenants.

- [ ] 02. Preparar estrutura de dominio iFood no app Next
Definicao de pronto: modulo `src/server/infra/external/ifood/**` criado para cliente HTTP e autenticacao; modulo `src/server/application/ifood/**` criado para orquestracao de merchants, catalogo, eventos e pedidos; rotas administrativas previstas em `src/app/api/v1/cheffia/Restaurant/[restaurantId]/integrations/ifood/**`; webhook previsto em `src/app/api/v1/cheffia/Integrations/iFood/webhook/route.ts`.
Arquivos/paths envolvidos: `src/server/infra/external/ifood/**`, `src/server/application/ifood/**`, `src/app/api/v1/cheffia/Restaurant/[restaurantId]/integrations/ifood/**`, `src/app/api/v1/cheffia/Integrations/iFood/**`.
Riscos/observacoes: espalhar logica de integracao entre `OrderHub`, `Menu` e `Restaurant` aumenta acoplamento; manter o dominio iFood isolado e consumido por adaptadores internos.
Nota multi-tenant/idempotencia: todo service iFood deve receber `tenantId`, `restaurantId` e `requestId` quando houver contexto de restaurante.

- [ ] 03. Modelar schema multi-tenant de integracao iFood no Supabase/Prisma
Definicao de pronto: entidades e constraints previstas no banco para vinculo restaurante-merchant, cache/estado de autenticacao, catalog sync, eventos e pedidos sincronizados; indices por tenant/restaurant/merchant definidos; politicas RLS preparadas para leitura segura por tenant.
Arquivos/paths envolvidos: `prisma/schema.prisma`, `prisma/migrations/**`, `supabase/policies/**`, `prisma/erd/diagram.md`.
Riscos/observacoes: modelagem errada de `merchantId`, `catalogId`, `eventId` e `orderId` gera duplicidade ou vazamento; tokens nao devem ser persistidos em texto puro.
Nota multi-tenant/idempotencia: garantir `unique(tenant_id, restaurant_id, merchant_id)` para vinculo; `unique(tenant_id, merchant_id, provider_event_id)` para eventos; `unique(tenant_id, merchant_id, order_id)` para pedidos externos.

- [ ] 04. Implementar cliente de autenticacao centralizada iFood
Definicao de pronto: cliente HTTP tipado para autenticacao via `client_credentials`, com cache de token por expiracao, renovacao antecipada, tratamento de `401/403`, retries controlados e logs seguros.
Arquivos/paths envolvidos: `src/server/infra/external/ifood/auth/**`, `src/server/infra/external/ifood/client.ts`, `src/server/infra/external/ifood/types.ts`.
Riscos/observacoes: app centralizado nao recebe refresh token; requisitar token em excesso aumenta latencia e risco de bloqueio; erro de clock pode provocar expiracao precoce.
Nota multi-tenant/idempotencia: token e app-scoped, mas toda chamada autenticada deve registrar `tenantId` e `merchantId` quando houver contexto de negocio.

- [ ] 05. Sincronizar merchants do iFood e vincular com restaurantes da Cheffia
Definicao de pronto: fluxo previsto para listar merchants autorizados, persistir dados essenciais (`merchantId`, nome, status, operacoes, timezone), exibir merchants disponiveis por tenant e vincular exatamente um merchant principal por restaurante para o MVP.
Arquivos/paths envolvidos: `src/server/application/ifood/merchants/**`, `src/app/api/v1/cheffia/Restaurant/[restaurantId]/integrations/ifood/link/**`, `src/components/**` de administracao de restaurante.
Riscos/observacoes: um tenant pode ter mais de um merchant; um merchant pode operar multiplos canais e operacoes; vinculo manual incorreto cria roteamento errado de pedidos.
Nota multi-tenant/idempotencia: o mapeamento `restaurantId -> merchantId` deve ser tenant-scoped, auditavel e protegido contra reuso cross-tenant.

- [ ] 06. Implementar leitura operacional do modulo Merchant
Definicao de pronto: endpoints/servicos previstos para consultar status da loja, horarios, interrupcoes e operacoes (`DELIVERY`, `TAKEOUT`), com decisao explicita do que a Cheffia apenas consome e do que eventualmente passa a gerenciar no MVP.
Arquivos/paths envolvidos: `src/server/application/ifood/merchantOperations/**`, `src/app/api/v1/cheffia/Restaurant/[restaurantId]/integrations/ifood/status/**`.
Riscos/observacoes: abrir/fechar loja no lugar errado pode gerar impacto operacional; o MVP deve priorizar observabilidade e leitura antes de automatizar alteracoes sensiveis.
Nota multi-tenant/idempotencia: qualquer comando de escrita no Merchant deve exigir tenant resolvido, `restaurantId` vinculado e `Idempotency-Key`.

- [ ] 07. Definir estrategia de mapeamento de catalogo entre iFood e Cheffia
Definicao de pronto: contrato de mapeamento documentado para categorias, itens, complementos, disponibilidade, imagens, `externalCode`, `catalogContext` e `contextModifiers`; politica de ownership definida para o MVP: iFood como fonte inicial de verdade.
Arquivos/paths envolvidos: `src/server/application/ifood/catalog/**`, `src/server/application/menu/**`, `src/models/**`, `prisma/schema.prisma`.
Riscos/observacoes: o catalogo v2 do iFood possui multiplos contextos e IDs por contexto; itens compartilhados entre contextos nao podem ser tratados como registros independentes sem regra de correlacao.
Nota multi-tenant/idempotencia: mapeamentos de categoria/item/complemento precisam de chave composta tenant + restaurant + merchant + external entity id/context id.

- [ ] 08. Implementar importacao bootstrap do catalogo iFood
Definicao de pronto: job inicial previsto para listar catalogos, categorias e itens do merchant vinculado, importar para a estrutura interna da Cheffia sem duplicar registros e produzir relatorio de reconciliacao.
Arquivos/paths envolvidos: `src/server/application/ifood/catalog/import/**`, `src/server/application/menu/**`, `src/app/api/v1/cheffia/Restaurant/[restaurantId]/integrations/ifood/catalog/import/route.ts`.
Riscos/observacoes: categorias pausadas, itens indisponiveis, produtos sem imagem e complementos obrigatorios/min-max podem divergir da modelagem interna; importacao parcial sem relatorio dificulta suporte.
Nota multi-tenant/idempotencia: importacao deve ser reentrante por job (`tenant_id + restaurant_id + merchant_id + sync_job_id`) e suportar retry sem criar itens duplicados.

- [ ] 09. Implementar sincronizacao incremental de catalogo
Definicao de pronto: fluxo previsto para detectar drift entre catalogo iFood e base interna, reaplicar importacoes incrementais, reconciliar indisponibilidades/precos e registrar conflitos para resolucao manual.
Arquivos/paths envolvidos: `src/server/application/ifood/catalog/sync/**`, `src/app/api/v1/cheffia/Restaurant/[restaurantId]/integrations/ifood/catalog/sync/route.ts`, futuros jobs em `scripts/**` ou scheduler.
Riscos/observacoes: sincronizacao em horario de pico pode alterar cardapio operacional; atualizacoes parciais precisam respeitar contexto do catalogo e nao sobrescrever mudancas locais sem rastreio.
Nota multi-tenant/idempotencia: cada sync incremental deve usar um cursor/job id por merchant e registrar versao/hash para evitar reaplicacao cega.

- [ ] 10. Implementar webhook iFood seguro e com presenca ativa
Definicao de pronto: endpoint HTTPS previsto para webhook com leitura do body bruto, validacao de `X-IFood-Signature` via HMAC-SHA256 usando `client_secret`, resposta rapida `202`, parse somente apos validacao, suporte a heartbeats/presenca e persistencia do payload bruto com headers.
Arquivos/paths envolvidos: `src/app/api/v1/cheffia/Integrations/iFood/webhook/route.ts`, `src/server/application/ifood/events/webhook/**`, `src/server/shared/secrets/**`.
Riscos/observacoes: validar assinatura apos parse quebra a autenticidade; indisponibilidade do endpoint pode afetar presenca e recepcao de pedidos em tempo real; URL precisa ser publica e HTTPS.
Nota multi-tenant/idempotencia: o webhook e app-scoped, mas a resolucao para tenant deve acontecer por `merchantId` do evento; eventos sem merchant conhecido devem ir para quarentena sem processamento de negocio.

- [ ] 11. Implementar polling de reconciliacao e contingency ACK
Definicao de pronto: job previsto para `GET /events:polling` a cada 30 segundos, com filtros por categoria `FOOD`, uso de `x-polling-merchants` a partir de escala relevante, ordenacao por `createdAt`, persistencia antes do `POST /events/acknowledgment` e suporte a fallback quando webhook falhar.
Arquivos/paths envolvidos: `src/server/application/ifood/events/polling/**`, futuros jobs/schedulers, `package.json` (scripts de operacao/teste).
Riscos/observacoes: o iFood retem eventos por 8 horas; polling sem ACK reenfileira eventos; parar o polling derruba presenca do merchant quando este metodo estiver ativo; evitar estourar limites com muitos merchants.
Nota multi-tenant/idempotencia: polling precisa particionar merchants por tenant/restaurant, deduplicar por `eventId` e enviar ACK inclusive para eventos desconhecidos/ja processados.

- [ ] 12. Criar registry de eventos iFood, deduplicacao e reprocessamento
Definicao de pronto: tabela e servico previstos para registrar cada entrega de evento (webhook ou polling), status (`pending`, `processing`, `processed`, `failed`, `quarantined`), tentativas, erro final e capacidade de reprocessar manualmente.
Arquivos/paths envolvidos: `prisma/schema.prisma`, `prisma/migrations/**`, `src/server/application/ifood/events/registry/**`, `src/app/api/v1/cheffia/Integrations/iFood/events/**`.
Riscos/observacoes: o iFood pode entregar eventos duplicados e fora de ordem; eventos antigos de `PLACED` podem reaparecer; nao confiar em ordem de chegada para estado final do pedido.
Nota multi-tenant/idempotencia: `provider_event_id` deve ser a chave de deduplicacao principal; a maquina de estados interna deve ser monotona e tolerante a replay.

- [ ] 13. Materializar pedidos iFood no Order Hub da Cheffia
Definicao de pronto: fluxo previsto para consultar `GET /orders/{id}` quando chegar evento relevante, armazenar snapshot imutavel do pedido, mapear cliente, itens, complementos, valores, entrega/retirada e criar agregados internos sem duplicacao.
Arquivos/paths envolvidos: `src/server/application/ifood/orders/**`, `src/server/application/orderhub/**`, `prisma/schema.prisma`, `src/components/OrderHubContent/**`.
Riscos/observacoes: melhores praticas do iFood recomendam consultar o detalhe do pedido apenas uma vez; o detalhe do pedido deve virar snapshot interno e nao dependencia de leitura constante da API.
Nota multi-tenant/idempotencia: cada `orderId` externo deve materializar exatamente um pedido interno principal por tenant/merchant, mesmo com repeticao de `PLACED`.

- [ ] 14. Implementar workflow operacional de pedidos FOOD
Definicao de pronto: plano de integracao definido para confirmar pedido, tratar cancelamentos, acompanhar eventos assincronos de confirmacao/cancelamento e refletir status no Order Hub sem assumir sincronismo indevido.
Arquivos/paths envolvidos: `src/server/application/ifood/orderActions/**`, `src/server/application/orderhub/**`, `src/app/api/v1/cheffia/OrderHub/**`.
Riscos/observacoes: confirmacao/cancelamento no iFood sao assincronos e retornos `202` nao significam estado final; o estado efetivo vem por evento; nao consultar nem atualizar pedidos apos a janela operacional recomendada.
Nota multi-tenant/idempotencia: toda acao de confirmacao/cancelamento precisa de `Idempotency-Key`, correlacao por `orderId` e reconciliacao por evento subsequente.

- [ ] 15. Adaptar frontend/admin para vinculacao, saude e operacao da integracao
Definicao de pronto: telas/componentes previstos para mostrar merchant vinculado, ultimo sync de catalogo, status de webhook/polling, fila de erros, pedidos iFood recebidos e acoes operacionais permitidas ao restaurante.
Arquivos/paths envolvidos: `src/app/restaurant/account/**`, `src/components/**`, `src/hooks/**`.
Riscos/observacoes: ocultar o estado da integracao dificulta suporte e operacao; o frontend nao deve expor secrets nem detalhes sensiveis do app centralizado.
Nota multi-tenant/idempotencia: toda visualizacao e comando do frontend deve operar apenas no restaurante/tenant autenticado.

- [ ] 16. Criar observabilidade, metricas e runbook operacional
Definicao de pronto: padrao de logs e dashboards definido para `tenantId`, `restaurantId`, `merchantId`, `orderId`, `eventId`, origem (`webhook`/`polling`), latencia, retries, ACK pendente e health do webhook; runbook previsto para falha de webhook, backlog de polling, erro de assinatura e merchant offline.
Arquivos/paths envolvidos: futuro `migração backend/IFOOD_RUNBOOK.md`, `src/server/**`, configuracoes de observabilidade da plataforma.
Riscos/observacoes: sem telemetria nao ha como sustentar homologacao nem operacao de producao; merchants podem ficar offline sem alerta explicito.
Nota multi-tenant/idempotencia: metricas e logs precisam permitir rastrear replay de evento e provar isolamento cross-tenant.

- [ ] 17. Atualizar contratos OpenAPI, collections e documentacao tecnica
Definicao de pronto: endpoints administrativos/webhook da integracao iFood descritos no OpenAPI; collections Postman/Insomnia atualizadas; README tecnico do modulo iFood criado com variaveis, fluxo de auth e cenarios de suporte.
Arquivos/paths envolvidos: `src/server/openapi/**`, `scripts/generate-openapi.ts`, `postman/**`, `insomnia/**`, `src/server/infra/external/ifood/README.md`.
Riscos/observacoes: drift entre implementacao e contrato dificulta testes e suporte; o webhook deve documentar headers e comportamento de validacao de assinatura.
Nota multi-tenant/idempotencia: documentar headers obrigatorios, regras de deduplicacao e resolucao de tenant por merchant.

- [ ] 18. Executar testes tecnicos, operacionais e de homologacao FOOD
Definicao de pronto: matriz de testes criada cobrindo auth, merchant link, importacao de catalogo, webhook valido/invalido, polling + ACK, duplicidade de evento, evento fora de ordem, repeticao de `PLACED`, materializacao de pedido, confirmacao assincrona, cancelamento e isolamento multi-tenant; testes com pedidos de teste automaticos e manuais previstos.
Arquivos/paths envolvidos: futuro `migração backend/IFOOD_TEST_MATRIX.md`, `tests/ifood/**`, `postman/**`, `src/server/openapi/openapi.json`.
Riscos/observacoes: testar apenas chamadas isoladas nao atende a homologacao; homologacao avalia o app inteiro; pedidos de teste exigem loja aberta/presenca ativa.
Nota multi-tenant/idempotencia: incluir casos obrigatorios de replay, ACK de evento ja processado, erro de assinatura e vazamento cross-tenant.

- [ ] 19. Executar hardening final, homologacao e readiness de producao
Definicao de pronto: webhook publico HTTPS validado; segredos configurados na Vercel; politicas de retry, timeout e alertas revisadas; checklist de homologacao FOOD preenchido; procedimento para solicitar acessos dos merchants e plano de rollout por restaurante documentados.
Arquivos/paths envolvidos: configuracoes da Vercel, `.env*`, futuro `migração backend/IFOOD_HOMOLOGATION_CHECKLIST.md`, futuro `migração backend/IFOOD_GO_LIVE.md`.
Riscos/observacoes: homologacao exige app funcional; falha de assinatura, polling sem ACK ou pedidos nao confirmados corretamente bloqueiam aprovacao; rollout simultaneo para muitos merchants aumenta risco operacional.
Nota multi-tenant/idempotencia: rollout deve ser progressivo por tenant/restaurante, com possibilidade de desligar a integracao de um merchant sem impacto nos demais.

---

## Ordem recomendada de execucao incremental
1. Itens 01 a 04 (fundacao, credenciais, schema e auth).
2. Itens 05 e 06 (merchant linkage e operacao da loja).
3. Itens 07 a 09 (mapeamento e sincronizacao de catalogo).
4. Itens 10 a 12 (webhook, polling, ACK, registry e deduplicacao).
5. Itens 13 e 14 (materializacao e workflow operacional de pedidos).
6. Itens 15 a 17 (frontend admin, observabilidade e contratos).
7. Item 18 (testes tecnicos + operacionais + homologacao).
8. Item 19 (hardening final, readiness e rollout controlado).

## Instrucoes rapidas de teste iFood (dentro do TODO)
1. Criar/validar o app no Developer Portal com modulos `Authentication`, `Merchant`, `Catalog`, `Order` e `Events`.
2. Configurar `IFOOD_CLIENT_ID`, `IFOOD_CLIENT_SECRET` e `IFOOD_WEBHOOK_URL` no ambiente local/preview.
3. Vincular ao menos um merchant de teste a um restaurante da Cheffia.
4. Configurar webhook HTTPS no Portal e validar recebimento com assinatura correta.
5. Executar polling de contingencia a cada 30 segundos e enviar ACK para todos os eventos recebidos.
6. Gerar pedido de teste automatico e manual no Portal/App iFood.
7. Validar que o pedido chega ao Order Hub, nao duplica com replay e que os status finais chegam por evento.

## Referencias oficiais obrigatorias desta integracao
- Categories / FOOD: `https://developer.ifood.com.br/pt-BR/docs/categories/?category=FOOD`
- Getting Started: `https://developer.ifood.com.br/pt-BR/docs/getting-started`
- Guias de integracao: `https://developer.ifood.com.br/pt-BR/docs/guides`
- Primeiros passos gerais: `https://developer.ifood.com.br/pt-BR/docs/getting-started/first-steps`
- Authentication centralizado: `https://developer.ifood.com.br/pt-BR/docs/guides/modules/authentication/centralized`
- Merchant / Operacoes: `https://developer.ifood.com.br/pt-BR/docs/guides/modules/merchant/operations`
- Catalog / Definicoes: `https://developer.ifood.com.br/pt-BR/docs/guides/modules/catalog/definitions`
- Catalog / Utilizando a API: `https://developer.ifood.com.br/pt-BR/docs/guides/modules/catalog/using-api`
- Events / Webhook: `https://developer.ifood.com.br/pt-BR/docs/guides/modules/events/webhook-overview`
- Events / Validacao de assinatura: `https://developer.ifood.com.br/pt-BR/docs/guides/modules/events/webhook-signature`
- Events / Polling: `https://developer.ifood.com.br/pt-BR/docs/guides/modules/events/polling-overview`
- Events / Presenca: `https://developer.ifood.com.br/pt-BR/docs/guides/modules/events/presence`
- Events / Homologacao: `https://developer.ifood.com.br/pt-BR/docs/guides/modules/events/homologation`
- Order / Workflow: `https://developer.ifood.com.br/pt-BR/docs/guides/modules/order/workflow/`
- Melhores praticas: `https://developer.ifood.com.br/pt-BR/docs/getting-started/documentation/best-practices`
