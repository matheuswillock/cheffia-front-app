# Documento Inicial de Implementacao Asaas no Cheffia

Data de referencia: 2026-03-09

## Escopo

Este documento consolida o estado atual do projeto `cheffia-front-app` e define a estrategia inicial para implementar:

- subconta Asaas por restaurante
- onboarding financeiro automatizado
- cobranca de pedidos dos restaurantes
- dashboard financeiro
- conciliacao
- repasse/comissao da Cheffia
- preparacao para antecipacao de credito

O documento foi produzido a partir do codigo atual e dos materiais locais em `DOCUMENTAÇÃO_ASAAS`.

Diretriz fechada deste projeto: a implementacao legada com Stripe sera removida 100% e substituida pelo Asaas.

## 1. Diagnostico do estado atual

### 1.1 O que ja existe funcionando com Asaas

- Existe um cliente HTTP centralizado do Asaas em `src/server/infra/external/asaas/client.ts`.
- O cliente atual ja suporta criar cliente, criar cobranca e consultar pagamento.
- O fluxo de `OrderHub` ja cria cobranca Pix pelo Asaas em `src/server/application/orderhub/orderHubService.ts`.
- O projeto ja possui ingestao de webhook Asaas com validacao de token, deduplicacao e persistencia em `asaas_webhook_events`.
- Ja existe base multi-tenant com `Tenant`, `Restaurant`, `CustomerOrder`, `CustomerOrderPaymentDetail`, `RestaurantPayment`, `IdempotencyKey`, `AsaasWebhookEvent` e `OutboxEvent`.
- Ja existe RLS para tabelas de pedido e pagamento.
- Ja existe idempotencia para rotas de escrita e outbox para eventos internos.

### 1.2 O que ainda esta acoplado ao Stripe e precisa ser removido

- `src/server/application/payments/paymentService.ts` ainda usa Stripe.
- `src/app/api/v1/cheffia/Payment/intent/create/route.ts` ainda expone criacao de payment intent Stripe.
- `src/app/api/v1/cheffia/Payment/product/create/route.ts` ainda expone criacao de produto/preco Stripe.
- `src/components/PaymentContent/Checkout.tsx` ainda usa `@stripe/react-stripe-js`.
- `src/utils/stripe.ts` ainda inicializa chaves Stripe no runtime.
- Os `.env*` lidos no projeto hoje possuem `STRIPE_*` e nao possuem `ASAAS_*`.

### 1.3 O que pode ser reaproveitado

- O modelo multi-tenant atual e reaproveitavel.
- A estrutura de idempotencia e reaproveitavel para criacao de subcontas, onboarding e pagamentos.
- `asaas_webhook_events` e reaproveitavel como trilha de entrada dos eventos do provedor.
- `outbox_events` e reaproveitavel para notificar realtime, dashboard e jobs de conciliacao.
- `customer_order_payment_details` e `restaurant_payments` podem servir de base, mas precisam evoluir.
- O webhook local via `ngrok` ja esta documentado e existem scripts no `package.json`.

### 1.4 Gaps tecnicos e funcionais

#### Cadastro do restaurante

- O formulario atual coleta apenas nome, endereco livre, telefone, documento, email e nome do proprietario.
- O fluxo de subconta Asaas precisa de mais dados cadastrais e de endereco estruturado.
- Hoje nao ha captura de `postalCode`, `addressNumber`, `province`, `complement`, nem tipagem mais forte de PF/PJ.
- O cadastro atual nao possui etapa financeira separada.

#### Dominio financeiro

- Nao existe modelagem para subconta Asaas por restaurante.
- Nao existe campo para `asaasAccountId`, `walletId`, `apiKey` da subconta, status cadastral, status de onboarding ou expiracao anual de dados comerciais.
- Nao existe modelagem de split, transferencia, repasse, comissao, taxa do provedor, valor liquido ou agenda de liquidacao.
- Nao existe ledger financeiro interno para auditoria e dashboard.
- Nao existe mecanismo de conciliacao entre estado interno e estado do Asaas.

#### Pagamento

- O fluxo atual e Pix-only.
- O objetivo de antecipacao de credito ainda nao cabe no desenho atual, porque antecipacao depende de recebiveis mais ricos, especialmente cartao.
- O metodo `createPayment` cria o `customer` do Asaas usando os dados do restaurante, e nao do pagador final do pedido.
- Isso mistura estabelecimento recebedor com pagador da cobranca e precisa ser corrigido antes da expansao do dominio.

#### Webhooks

- O webhook atual deduplica corretamente, mas o processamento de negocio ainda esta em placeholder.
- Ainda nao existe roteamento real de eventos de pagamento, conta, documentacao, expiracao de dados comerciais e conciliacao.
- Nao existe dead-letter, replay operacional ou fila de reprocessamento.

#### Seguranca

- O projeto ainda nao possui estrategia para armazenar credenciais de subcontas com criptografia.
- Nao existe politica de rotacao de `apiKey` da subconta.
- Nao existe camada explicita para segregacao de acesso por tipo de segredo.

#### Observabilidade e suporte

- Faltam logs orientados a dominio financeiro.
- Faltam metricas de onboarding, cobranca, confirmacao e repasse.
- Faltam runbooks para falha de webhook, falha de criacao de subconta, reprovacao documental e expiracao comercial anual.

#### Frontend financeiro

- O dashboard em `src/app/dashboard/[slug]/page.tsx` esta estatico.
- A tela `src/app/restaurant/account/page.tsx` ainda esta vazia.
- Nao existe area de onboarding financeiro nem acompanhamento de documentos.

### 1.5 Riscos de seguir sem remodelar o dominio

- Criar subconta sem ter onde persistir `walletId`, `apiKey` e status tornaria o onboarding incompleto e pouco operavel.
- Expandir cobrancas sem separar pagador final de restaurante gera distorcao contabil e operacao incorreta.
- Construir dashboard sem ledger conciliavel cria UI sem base confiavel.
- Implementar split ou transferencia sem camada de estrategia vai acoplar o produto a uma unica politica financeira.
- Avancar para antecipacao antes de modelar recebivel, taxa, liquido e eventos de liquidacao vai gerar retrabalho alto.

## 2. Decisoes de arquitetura com pros e contras

### 2.1 Subconta padrao vs subconta white label

Recomendacao: usar subconta white label como alvo de produto. Conta padrao pode existir apenas como artificio de teste pontual, nao como estrategia de produto.

Pros da white label:

- experiencia do restaurante fica dentro do Cheffia
- onboarding por `onboardingUrl` sem marca Asaas
- melhor aderencia ao objetivo de produto da plataforma
- maior controle da jornada

Contras da white label:

- depende de habilitacao comercial previa com o Asaas
- exige que o Cheffia implemente a operacao inteira de onboarding e suporte
- exige gestao segura de credenciais e status da subconta

Pros da padrao:

- ativacao operacional mais simples
- o restaurante consegue interagir diretamente com o painel do Asaas
- menor esforco inicial de produto

Contras da padrao:

- quebra a experiencia white label
- reduz controle do Cheffia sobre a jornada
- aumenta dependencia de passos fora do sistema

Impacto tecnico:

- white label exige modelagem completa de onboarding, status e credenciais
- padrao exige menos backend, mas pior encaixe com o produto

Impacto operacional:

- white label centraliza suporte no Cheffia
- padrao terceiriza parte da jornada para o Asaas

Dependencia do Asaas:

- white label depende de liberacao previa do recurso

Risco regulatorio/financeiro:

- white label aumenta responsabilidade operacional do Cheffia

### 2.2 Split automatico vs transferencia posterior

Recomendacao: modelar as duas estrategias no dominio, mas iniciar a implementacao pensando em `split_automatico` como opcao padrao para cobrancas com comissao simples e automatica, mantendo `transferencia_posterior` para restaurantes ou planos que exijam repasse em outro momento.

Pros do split:

- totalmente automatico no recebimento
- mais rapido para MVP operacional
- reduz necessidade de job de repasse
- combina com a filosofia de processos automaticos e rapidos

Contras do split:

- nao permite adiar repasse
- e rigido para cenarios de reserva, ajuste manual ou janela D+N
- a taxa do Asaas entra no calculo do valor liquido antes da divisao

Pros da transferencia posterior:

- permite definir janela de repasse
- suporta reserva, ajuste, retencao e reconciliacao antes do envio
- melhor para operacoes mais sofisticadas

Contras da transferencia posterior:

- exige mais estado interno
- exige job de repasse
- aumenta risco operacional e necessidade de idempotencia forte
- pode encontrar bloqueio por conflito de transferencias duplicadas em 15 minutos

Impacto tecnico:

- split pede `walletId` e regra de comissao no momento da cobranca
- transferencia pede tabela de repasse e orquestracao posterior

Impacto operacional:

- split simplifica
- transferencia aumenta controle

Dependencia do Asaas:

- split depende de suporte do endpoint da cobranca
- transferencia depende de `walletId` e fluxo entre contas vinculadas

Risco regulatorio/financeiro:

- split e menor risco de atraso operacional
- transferencia e melhor quando o negocio precisa governar liberacao de saldo

### 2.3 Armazenar chave da subconta vs operar so pela conta raiz

Recomendacao: armazenar a `apiKey` da subconta de forma criptografada no momento da criacao, com rotacao e recuperacao operacional via endpoints de gerenciamento de chaves apenas como break-glass.

Pros de armazenar a chave:

- necessario para operacoes em contexto da subconta como `myAccount/status`, documentos e cobrancas no contexto do restaurante
- reduz dependencia de liberacao temporaria do endpoint de gerenciamento de chaves

Contras:

- aumenta responsabilidade de seguranca
- exige criptografia, controle de acesso e rotacao

Pros de operar so pela conta raiz:

- menos segredos armazenados
- menor superficie de ataque

Contras:

- nao cobre todos os fluxos que precisam do contexto da subconta
- depende de janela temporaria de liberacao para gestao de chaves

Impacto tecnico:

- exige camada de secrets e criptografia antes de subir subcontas para producao

Risco regulatorio/financeiro:

- segredo mal armazenado e risco alto

### 2.4 Polling vs webhook vs hibrido para confirmacao de pagamento

Recomendacao: modelo hibrido.

Pros do hibrido:

- webhook vira fonte principal de verdade
- polling curto melhora UX logo apos a geracao do Pix
- job de reconciliacao cobre atraso ou perda de evento

Contras:

- mais componentes para manter

Impacto tecnico:

- exige webhook real de negocio, polling controlado e reconciliacao periodica

Risco:

- usar apenas polling e caro e fragil
- usar apenas webhook piora UX e dificulta debug local

### 2.5 Dashboard financeiro interno vs somente consulta ao Asaas

Recomendacao: dashboard baseado em read model interno conciliado com o Asaas.

Pros:

- performance melhor
- historico e auditoria dentro do produto
- permite combinar pedido, pagamento, repasse e onboarding num unico lugar

Contras:

- exige mais modelagem e reconciliacao

Impacto tecnico:

- demanda ledger, snapshots e jobs de sync

Risco:

- consultar so o Asaas em tempo real nao fecha com o dominio do pedido do Cheffia

### 2.6 Cobranca no contexto da subconta do restaurante vs conta raiz

Recomendacao: cobrar no contexto da subconta do restaurante.

Pros:

- cada restaurante passa a ser dono natural da sua operacao financeira
- alinha onboarding, status da conta, dashboard e recebiveis
- prepara melhor o terreno para expansao futura de produtos financeiros

Contras:

- exige gerenciar credenciais por subconta
- aumenta o trabalho de configuracao de webhooks e seguranca

Observacao:

- se a politica financeira exigir simplificacao extrema no inicio, a conta raiz com split pode ser usada como etapa transitoria, mas nao deve ser o alvo final do produto.

## 3. Modelo de dominio alvo

### 3.1 Entidades novas

#### `restaurant_financial_accounts`

Um registro por restaurante e provedor.

Campos principais:

- `id`
- `tenant_id`
- `restaurant_id`
- `provider`
- `asaas_account_id`
- `asaas_wallet_id`
- `asaas_api_key_encrypted`
- `asaas_api_key_last4`
- `account_type` (`standard`, `white_label`)
- `onboarding_status`
- `commercial_info_status`
- `bank_account_status`
- `documentation_status`
- `general_status`
- `commercial_info_expiration_scheduled_at`
- `commercial_info_is_expired`
- `webhook_status`
- `last_status_sync_at`
- `last_error`
- `created_at`
- `updated_at`

#### `restaurant_financial_onboarding_documents`

Snapshot dos documentos pendentes/solicitados pelo Asaas.

Campos principais:

- `id`
- `tenant_id`
- `restaurant_id`
- `financial_account_id`
- `provider_document_group_id`
- `type`
- `title`
- `description`
- `responsible_name`
- `responsible_type`
- `status`
- `onboarding_url`
- `reject_reasons`
- `last_synced_at`

#### `restaurant_financial_settlement_rules`

Regras por restaurante/plano.

Campos principais:

- `id`
- `tenant_id`
- `restaurant_id`
- `settlement_strategy` (`split_automatico`, `transferencia_posterior`)
- `platform_fee_type` (`fixed`, `percentage`)
- `platform_fee_value`
- `transfer_delay_days`
- `active`

#### `financial_ledger_entries`

Livro razao interno para auditoria e dashboard.

Campos principais:

- `id`
- `tenant_id`
- `restaurant_id`
- `customer_order_id`
- `payment_id`
- `entry_type`
- `direction` (`credit`, `debit`)
- `gross_amount`
- `net_amount`
- `fee_amount`
- `provider_reference`
- `occurred_at`
- `metadata`

#### `restaurant_payout_transfers`

Necessario quando a estrategia for transferencia posterior.

Campos principais:

- `id`
- `tenant_id`
- `restaurant_id`
- `source_wallet_id`
- `destination_wallet_id`
- `amount`
- `status`
- `provider_transfer_id`
- `scheduled_for`
- `processed_at`
- `last_error`

#### `financial_reconciliation_runs` e `financial_reconciliation_items`

Para sync, auditoria e detecao de divergencias.

### 3.2 Campos novos em entidades existentes

#### `restaurants`

Adicionar ou normalizar:

- `person_type`
- `company_type`
- `birth_date`
- `postal_code`
- `address_number`
- `province`
- `complement`
- `city`
- `state`
- `financial_onboarding_started_at`
- `financial_onboarding_completed_at`

#### `customer_order_payment_details`

Evoluir para incluir:

- `provider_customer_id`
- `provider_payment_id`
- `billing_type`
- `gross_amount`
- `net_amount`
- `platform_fee_amount`
- `provider_fee_amount`
- `pix_qr_code`
- `pix_copy_paste`
- `external_reference`
- `provider_raw_status`
- `last_provider_sync_at`
- `financial_account_id`

#### `restaurant_payments`

Hoje ela registra apenas o pagamento confirmado.
Deve passar a guardar tambem:

- `gross_amount`
- `net_amount`
- `provider_fee_amount`
- `platform_fee_amount`
- `settlement_strategy`
- `financial_account_id`

### 3.3 Maquinas de estado principais

#### Onboarding da subconta

- `draft`
- `creating_account`
- `account_created`
- `waiting_documents`
- `waiting_review`
- `approved`
- `rejected`
- `blocked`
- `commercial_info_expired`

#### Pagamento do pedido

- `pending`
- `pix_generated`
- `awaiting_payment`
- `paid`
- `refunded`
- `canceled`
- `failed`

#### Repasse

- `not_applicable`
- `scheduled`
- `processing`
- `completed`
- `failed`

### 3.4 Dados que devem ser persistidos

Persistir:

- ids e referencias do Asaas
- `walletId`
- status da conta
- expiracao comercial anual
- links de onboarding ativos
- cobrancas e confirmacoes
- valores bruto, liquido e taxas
- regras de comissao
- ledger
- conciliacao

Consultar sob demanda ou cachear curto prazo:

- detalhes nao criticos de tela administrativa do Asaas
- dados auxiliares que possam ser ressincronizados pelo provider

## 4. Fluxos ponta a ponta

### 4.1 Cadastro de novo restaurante

1. Usuario cria conta no Cheffia.
2. Usuario cadastra restaurante com dados operacionais basicos.
3. Sistema cria `tenant` e `restaurant`.
4. Sistema detecta se faltam dados financeiros obrigatorios.
5. Sistema abre etapa de onboarding financeiro imediatamente apos o cadastro basico.

### 4.2 Criacao e configuracao automatica da subconta

1. Backend valida se o restaurante possui dados minimos para subconta.
2. Backend chama `POST /v3/accounts` no Asaas.
3. No mesmo payload, backend configura webhook da subconta quando o modelo for white label.
4. Backend persiste `asaas_account_id`, `walletId`, `apiKey` criptografada e estado `account_created`.
5. Backend agenda uma sincronizacao inicial best-effort apos 15 segundos, com atraso configuravel por ambiente.
6. Se a rotina automatica nao executar no processo atual, o portal continua com sincronizacao manual como fallback.

### 4.3 Consulta de documentos pendentes

1. Job, workflow ou scheduler local espera pelo menos 15 segundos.
2. Backend chama `GET /v3/myAccount/documents` no contexto da subconta.
3. Sistema sincroniza grupos de documentos e `onboardingUrl`.
4. Se existir `onboardingUrl`, o sistema registra e expoe esse link no portal do restaurante.
5. Falhas de sincronizacao devem ser refletidas em `last_error` da conta para diagnostico operacional.

### 4.4 Envio de documentos

1. Restaurante acessa a area financeira.
2. Sistema mostra status de cada documento.
3. Antes de qualquer envio via API, o arquivo e salvo no backend em bucket privado do Supabase.
4. O backend registra trilha de auditoria com bucket, path, hash, tamanho, status e resposta do Asaas.
5. Para documentos com `onboardingUrl`, o sistema registra o link e redireciona o restaurante para esse fluxo externo.
6. Para documentos sem `onboardingUrl`, o backend envia o arquivo diretamente via API usando a chave da subconta.
7. Sistema atualiza o estado para `waiting_review`.

### 4.5 Acompanhamento cadastral

1. Webhooks de status da conta entram na trilha `asaas_webhook_events`.
2. Processador atualiza `restaurant_financial_accounts`.
3. Quando `general=APPROVED`, o restaurante fica apto para operar plenamente.
4. Se houver rejeicao, sistema mostra motivo e proxima acao.

### 4.6 Criacao da cobranca do pedido

1. Pedido e fechado no `OrderHub`.
2. Sistema resolve qual conta financeira pertence ao restaurante.
3. Sistema resolve a estrategia de repasse.
4. Sistema cria ou reutiliza um pagador adequado do pedido.
5. Sistema cria a cobranca Pix no contexto da subconta do restaurante.
6. Se a estrategia for split, a regra de comissao e enviada na cobranca.
7. Sistema persiste a cobranca interna e publica evento no outbox.

### 4.7 Confirmacao do pagamento

1. Frontend faz polling curto apos exibir o QR Code.
2. Webhook de pagamento entra como fonte principal de verdade.
3. Reconciliador compara o estado interno com o Asaas quando houver atraso ou divergencia.
4. Sistema marca pedido como pago e registra ledger.

### 4.8 Repasse, comissao e conciliacao

1. Em split, a comissao e o repasse acontecem automaticamente no recebimento.
2. Em transferencia posterior, sistema agenda `restaurant_payout_transfers`.
3. Ledger registra entradas e saidas.
4. Conciliador sinaliza divergencias entre pedido, pagamento, repasse e provider.

### 4.9 Dashboard financeiro

1. Read model agrega pagamentos, status da conta, onboarding, comissao e repasses.
2. Dashboard exibe saldo a receber, recebido, em analise, pendencias cadastrais e divergencias.
3. Conta aprovada e expiracao anual comercial aparecem como alertas operacionais.

### 4.10 Confirmacao anual de dados comerciais

1. Sistema recebe webhook `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON`.
2. Marca restaurante com alerta e data limite.
3. Exibe CTA para confirmacao/atualizacao dos dados.
4. Se vencer, sistema recebe `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED`.
5. Conta entra em estado `commercial_info_expired` ate regularizacao.

## 5. Plano de implementacao por fases

### Fase 0: setup local e sandbox Asaas no PC

Objetivo:

- permitir desenvolvimento local seguro e repetivel

Escopo:

- adicionar variaveis `ASAAS_*`
- validar webhook local via `ngrok`
- documentar ambiente sandbox

Arquivos provaveis:

- `.env.local`
- `src/server/infra/external/asaas/README.md`
- `migração backend/NGROK_WEBHOOK_LOCAL.md`
- `README.md`

Migracoes:

- nenhuma

Endpoints:

- reaproveitar `/api/v1/cheffia/OrderHub/webhook/asaas`

Testes:

- smoke test do webhook local
- validacao de boot com `ASAAS_API_KEY`

Criterio de pronto:

- app sobe com Asaas sandbox configurado
- webhook local recebe evento de teste

Risco e rollback:

- baixo risco

### Fase 1: remocao total do legado Stripe e definicao de fronteiras Asaas

Objetivo:

- remover Stripe do projeto e deixar o Asaas como provedor unico

Escopo:

- mapear tudo que ainda depende de Stripe
- remover rotas, servicos, utilitarios, telas e env vars do Stripe
- definir que todo o dominio financeiro passa a ser Asaas-only

Arquivos provaveis:

- `src/server/application/payments/paymentService.ts`
- `src/app/api/v1/cheffia/Payment/intent/create/route.ts`
- `src/app/api/v1/cheffia/Payment/product/create/route.ts`
- `src/components/PaymentContent/Checkout.tsx`
- `src/utils/stripe.ts`

Migracoes:

- nenhuma

Testes:

- garantir que fluxos novos nao dependem de Stripe

Criterio de pronto:

- nenhum fluxo de pagamento depende de Stripe

### Fase 2: modelagem de subcontas e onboarding financeiro

Objetivo:

- criar o dominio base necessario

Escopo:

- novas tabelas financeiras
- novos campos em `restaurants` e pagamentos
- RLS e indices

Arquivos provaveis:

- `prisma/schema.prisma`
- `prisma/migrations/*`
- `supabase/policies/*`

Migracoes:

- `restaurant_financial_accounts`
- `restaurant_financial_onboarding_documents`
- `restaurant_financial_settlement_rules`
- `financial_ledger_entries`
- `restaurant_payout_transfers`
- reconciliacao

Testes:

- `prisma validate`
- contratos de schema

Criterio de pronto:

- banco consegue persistir estado minimo de subconta e onboarding

Risco e rollback:

- medio

### Fase 3: automacao de cadastro de subconta e documentos

Objetivo:

- automatizar a criacao da subconta e sincronizar onboarding

Escopo:

- ampliar cadastro do restaurante
- criar `AsaasAccountService`
- criar sync inicial best-effort com atraso configuravel e fallback manual

Arquivos provaveis:

- `src/components/RegisterRestaurantContent/RegisterRestaurantForm.tsx`
- `src/server/application/restaurant/restaurantService.ts`
- `src/server/infra/external/asaas/*`
- novas rotas de onboarding financeiro

Endpoints:

- criar endpoint interno de iniciar onboarding financeiro
- criar endpoint de consultar status financeiro do restaurante

Webhooks:

- status de conta

Testes:

- mock da criacao de subconta
- mock da consulta de documentos
- idempotencia de onboarding

Criterio de pronto:

- restaurante novo sai do cadastro ja com subconta criada ou com erro operacional rastreavel

### Fase 4: cobranca de pedidos com estrategia de repasse

Objetivo:

- corrigir o fluxo de pagamento e conectar subconta + comissao

Escopo:

- ajustar `OrderHubService`
- parar de usar o restaurante como pagador da cobranca
- suportar cobranca no contexto da subconta
- suportar `split_automatico` e preparar `transferencia_posterior`

Arquivos provaveis:

- `src/server/application/orderhub/orderHubService.ts`
- `src/server/infra/external/asaas/client.ts`
- `src/server/infra/external/asaas/types.ts`
- `src/app/api/v1/cheffia/OrderHub/payment/route.ts`
- `src/app/api/v1/cheffia/OrderHub/payment/confirmation/route.ts`

Testes:

- criacao de cobranca por subconta
- confirmacao por polling
- persistencia de bruto/liquido/taxa

Criterio de pronto:

- pedido gera cobranca correta no contexto do restaurante e grava estado financeiro coerente

### Fase 5: webhooks, conciliacao e auditoria

Objetivo:

- tornar o estado financeiro confiavel

Escopo:

- transformar webhook em processamento real de negocio
- ledger
- reconciliacao
- replay operacional

Arquivos provaveis:

- `src/server/application/webhooks/asaasWebhookService.ts`
- `src/server/application/events/outboxEventsService.ts`
- novos servicos de reconciliacao

Webhooks:

- pagamento
- conta
- expiracao comercial

Testes:

- deduplicacao
- replay
- conciliacao divergente

Criterio de pronto:

- estado interno converge com provider e falhas sao reprocessaveis

### Fase 6: dashboard financeiro do restaurante

Objetivo:

- entregar visibilidade financeira real ao restaurante

Escopo:

- API de read model
- widgets financeiros
- centro de onboarding e pendencias

Arquivos provaveis:

- `src/app/dashboard/[slug]/page.tsx`
- `src/app/restaurant/account/page.tsx`
- novos componentes e hooks

Testes:

- queries do dashboard
- estados aprovados, pendentes, rejeitados e expirados

Criterio de pronto:

- dashboard consome dados reais e mostra pendencias operacionais

### Fase 7: antecipacao de credito e expansoes

Objetivo:

- preparar extensoes financeiras sem acoplar cedo demais

Escopo:

- validar suporte comercial e tecnico do Asaas
- modelar recebiveis elegiveis
- estudar produto por meio de cartao

Bloqueadores:

- hoje o fluxo e Pix-only
- antecipacao exige validacao de produto e possivel expansao para cartao

Criterio de pronto:

- RFC separada aprovada

## 6. Backlog tecnico priorizado

### P0

- criar modelagem de subconta e onboarding
- definir estrategia de secrets para `apiKey` da subconta
- corrigir o conceito de pagador da cobranca
- configurar `ASAAS_*` no ambiente local
- implementar criacao automatica de subconta
- implementar sync de documentos e status cadastral
- transformar webhook em fonte real de atualizacao financeira

### P1

- implementar split/transferencia como estrategia configuravel
- criar ledger financeiro interno
- criar conciliacao periodica
- criar dashboard financeiro real
- criar area de onboarding financeiro no frontend
- criar runbooks operacionais

### P2

- rotacao automatica de chaves de subconta
- relatorios financeiros exportaveis
- antecipacao de credito
- regras comerciais por plano/restaurante
- alertas proativos de expiracao e divergencia

## 7. Setup local do Asaas no PC

### 7.1 Variaveis de ambiente minimas

Adicionar no `.env.local`:

```env
ASAAS_API_KEY=$ASAAS_SANDBOX_ROOT_KEY
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_TIMEOUT_MS=10000
ASAAS_MAX_RETRIES=2
ASAAS_RETRY_BASE_DELAY_MS=250
ASAAS_INITIAL_DOCUMENT_SYNC_ENABLED=true
ASAAS_INITIAL_DOCUMENT_SYNC_DELAY_MS=15000
ASAAS_DEFAULT_SETTLEMENT_STRATEGY=split_automatico
ASAAS_DEFAULT_PLATFORM_FEE_TYPE=percentage
ASAAS_DEFAULT_PLATFORM_FEE_VALUE=0
ASAAS_DEFAULT_TRANSFER_DELAY_DAYS=0
ASAAS_MAIN_WALLET_ID=
ASAAS_WEBHOOK_TOKEN=change-me-local-token
ASAAS_WEBHOOK_ALLOW_UNSIGNED=false
ASAAS_WEBHOOK_ALLOWED_IPS=
```

Observacoes:

- `ASAAS_API_KEY` deve ser a chave da conta raiz sandbox.
- `ASAAS_INITIAL_DOCUMENT_SYNC_DELAY_MS` deve respeitar o intervalo minimo recomendado antes da primeira consulta de documentos da subconta.
- `ASAAS_DEFAULT_SETTLEMENT_*` define o comportamento padrao de comissao/repasse quando o restaurante ainda nao possui regra financeira explicita.
- `ASAAS_MAIN_WALLET_ID` so e necessario quando a estrategia usada for `transferencia_posterior`.
- para white label real, a funcionalidade precisa estar habilitada comercialmente.
- para sandbox white label, a documentacao local indica acionar suporte/gerente para liberacao.

### 7.2 Fluxo de setup local

1. Garantir que `bun install` ja foi executado.
2. Preencher `.env.local` com as variaveis acima.
3. Subir a app com `bun run dev`.
4. Abrir o tunel com `bun run ngrok:webhook`.
5. Gerar a URL do webhook com `bun run webhook:local:url`.
6. Configurar essa URL no Asaas sandbox.
7. Usar `asaas-access-token` igual ao `ASAAS_WEBHOOK_TOKEN`.

### 7.3 Como validar o webhook local

1. Disparar um evento de teste no Asaas para a URL exposta.
2. Confirmar retorno HTTP 200.
3. Validar persistencia em `asaas_webhook_events`.
4. Confirmar que eventos duplicados nao sao reprocessados.

### 7.4 Scripts ja disponiveis

- `bun run dev`
- `bun run ngrok:webhook`
- `bun run ngrok:webhook:url`
- `bun run webhook:local:url`
- `bun run prisma:env:check`

### 7.5 O que ainda falta para o setup ficar completo

- um `.env.example` sem segredos com bloco `ASAAS_*`
- um smoke test de conectividade com o Asaas sandbox
- endpoint ou script de teste para criacao de subconta sandbox
- documentacao de rotacao/local override para `ASAAS_WEBHOOK_ALLOW_UNSIGNED`

## 8. Primeira execucao recomendada

A primeira etapa pratica a executar agora no codigo e a Fase 2: modelagem do dominio financeiro de subcontas e onboarding.

Justificativa:

- hoje o projeto nao tem onde persistir `asaasAccountId`, `walletId`, `apiKey` da subconta, `onboardingUrl`, status cadastral e expiracao anual
- sem essa base, qualquer tentativa de automatizar onboarding ou cobrar no contexto do restaurante ficara incompleta
- essa fase destrava o resto do plano com menor risco de retrabalho

## Conclusao

O projeto ja tem uma boa fundacao tecnica para multi-tenant, idempotencia e ingestao de eventos. O problema central nao e falta de integracao HTTP com o Asaas; o problema central e que o dominio financeiro ainda nao foi modelado.

Portanto, o caminho correto e:

- remover o legado Stripe
- modelar subconta/onboarding/ledger
- automatizar criacao da subconta
- corrigir o fluxo de pagamento para operar no contexto do restaurante
- so depois subir dashboard, repasse sofisticado e antecipacao
