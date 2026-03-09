# Prompt Melhorado: Plano de Implementacao Asaas no Cheffia

Use este prompt para orientar a analise, o desenho da arquitetura, a criacao do documento decisorio e a execucao em etapas da integracao financeira do Asaas no projeto Cheffia.

## Prompt

Voce esta atuando como arquiteto e engenheiro senior no projeto `cheffia-front-app`.

Sua tarefa e analisar o projeto atual e produzir um plano executavel, em fases, para implementar o ecossistema financeiro do Asaas no Cheffia, com foco em pagamentos de pedidos dos restaurantes, onboarding financeiro automatizado, subcontas por restaurante e gestao financeira white label.

Antes de propor qualquer implementacao, leia e considere obrigatoriamente o estado atual do projeto:

- Backend em Next.js Route Handlers, Prisma e Supabase.
- O projeto ja possui base multi-tenant, idempotencia, outbox e ingestao inicial de webhooks.
- Ja existe integracao inicial com Asaas para cobranca Pix do `OrderHub`.
- Ainda existem rotas e componentes legados com Stripe, mas a decisao do projeto ja esta tomada: Stripe deve ser removido 100% e substituido pelo Asaas.
- O cadastro atual do restaurante ainda nao coleta todos os dados exigidos para subconta Asaas.
- O banco atual ainda nao possui modelagem completa para subcontas, wallet, onboarding, status cadastral, conciliacao, agenda de repasse, antecipacao e trilha operacional.
- A pasta `DOCUMENTAÇÃO_ASAAS` contem os materiais locais que devem ser usados como fonte principal para o desenho.

Considere obrigatoriamente estes arquivos e modulos do projeto durante a analise:

- `src/server/infra/external/asaas/client.ts`
- `src/server/infra/external/asaas/types.ts`
- `src/server/application/orderhub/orderHubService.ts`
- `src/app/api/v1/cheffia/OrderHub/payment/route.ts`
- `src/app/api/v1/cheffia/OrderHub/payment/confirmation/route.ts`
- `src/app/api/v1/cheffia/OrderHub/webhook/asaas/route.ts`
- `src/server/application/webhooks/asaasWebhookService.ts`
- `src/server/application/payments/paymentService.ts`
- `src/app/api/v1/cheffia/Payment/intent/create/route.ts`
- `src/app/api/v1/cheffia/Payment/product/create/route.ts`
- `src/components/PaymentContent/Checkout.tsx`
- `src/utils/stripe.ts`
- `src/components/RegisterRestaurantContent/RegisterRestaurantForm.tsx`
- `src/server/application/restaurant/restaurantService.ts`
- `prisma/schema.prisma`
- `supabase/policies/20260305121000_orderhub_payment_rls.sql`
- `migração backend/NGROK_WEBHOOK_LOCAL.md`

Considere obrigatoriamente estes documentos locais do Asaas:

- `DOCUMENTAÇÃO_ASAAS/criacao_de_subcontas.md`
- `DOCUMENTAÇÃO_ASAAS/criacao_de_conta_whitelabel.md`
- `DOCUMENTAÇÃO_ASAAS/detalhamento_do_fluxo_de_aprovacao_de_subcontas.md`
- `DOCUMENTAÇÃO_ASAAS/onboarding_envio_de_documentos_via_link.md`
- `DOCUMENTAÇÃO_ASAAS/split.md`
- `DOCUMENTAÇÃO_ASAAS/transferencias.md`
- `DOCUMENTAÇÃO_ASAAS/gerenciamento_das_chaves_de_api_de_subcontas.md`
- `DOCUMENTAÇÃO_ASAAS/confirmacao_anual_de_dados_comerciais_para_subcontas.md`

## Objetivo de negocio

Precisamos implementar um sistema financeiro no Cheffia para restaurantes, com:

- Subconta Asaas por restaurante.
- Processo de onboarding automatico e rapido para novos restaurantes.
- Pagamento dos pedidos pelo Asaas.
- Dashboard financeiro para o restaurante.
- Conciliacao e historico financeiro.
- Repasse/comissao da Cheffia.
- Analise de quando usar `split` automatico e quando usar `transferencia` posterior.
- Preparacao para antecipacao de credito, respeitando o que o Asaas suporta e o que dependera de produto/processo interno.
- Operacao white label sempre que fizer sentido.

## O que voce deve entregar

Sua resposta deve seguir exatamente nesta ordem:

### 1. Diagnostico do estado atual

Mapeie de forma objetiva:

- O que ja existe funcionando com Asaas.
- O que ainda esta acoplado ao Stripe e precisa ser removido.
- Quais tabelas e fluxos atuais podem ser reaproveitados.
- Quais gaps de cadastro, modelagem, seguranca, observabilidade e operacao impedem a implementacao completa.
- Quais riscos existem se tentarmos seguir sem remodelar o dominio financeiro.

### 2. Decisoes de arquitetura com prós e contras

Monte uma analise decisoria comparando pelo menos:

- Subconta padrao vs subconta white label.
- Split automatico no recebimento vs transferencia posterior da conta raiz para subconta.
- Armazenar chave de API da subconta vs operar preferencialmente pela conta raiz quando possivel.
- Confirmacao de pagamento por polling, webhook ou modelo hibrido.
- Dashboard financeiro baseado somente em dados internos vs conciliado com dados do Asaas.

Para cada decisao, informe:

- recomendacao
- pros
- contras
- impacto tecnico
- impacto operacional
- dependencia do Asaas
- risco regulatorio/financeiro

### 3. Modelo de dominio alvo

Desenhe o dominio alvo do sistema financeiro e descreva:

- entidades novas
- campos novos nas entidades existentes
- status e maquinas de estado
- relacao entre restaurante, tenant, subconta Asaas, wallet, cobranca, repasse, webhook e conciliacao
- quais dados devem ser persistidos internamente e quais devem ser apenas cacheados ou consultados sob demanda

Considere explicitamente a necessidade de novos campos/tabelas para:

- `asaasAccountId`
- `asaasWalletId`
- `asaasApiKeyEncrypted` ou estrategia alternativa
- tipo da conta
- status de onboarding
- status cadastral
- expiracao de dados comerciais
- links de onboarding pendentes
- configuracao de webhook da subconta
- estrategia de repasse
- regras de comissao da Cheffia
- ledger ou trilha de eventos financeiros
- conciliacao

### 4. Fluxos ponta a ponta

Descreva o fluxo completo, em passos numerados, para:

1. Cadastro de um novo restaurante.
2. Criacao e configuracao automatica da subconta Asaas.
3. Espera tecnica de 15 segundos e consulta de documentos pendentes.
4. Redirecionamento do responsavel para `onboardingUrl` quando aplicavel.
5. Acompanhamento do status cadastral e reenvio/correcao de documentos.
6. Criacao da cobranca de um pedido.
7. Confirmacao do pagamento.
8. Registro de recebimento, repasse/comissao e conciliacao.
9. Exibicao desses dados no dashboard financeiro.
10. Tratamento de confirmacao anual de dados comerciais.

### 5. Plano de implementacao por fases

Crie um plano executavel em fases. Cada fase deve conter:

- objetivo
- escopo
- arquivos provaveis a alterar
- migracoes de banco
- endpoints a criar ou alterar
- eventos/webhooks envolvidos
- testes necessarios
- criterio de pronto
- riscos e rollback

Estruture no minimo estas fases:

- Fase 0: setup local e sandbox Asaas no PC
- Fase 1: remocao total do legado Stripe e definicao de fronteiras Asaas
- Fase 2: modelagem de subcontas e onboarding financeiro
- Fase 3: automacao de cadastro de subconta e documentos
- Fase 4: cobranca de pedidos com estrategia de repasse
- Fase 5: webhooks, conciliacao e auditoria
- Fase 6: dashboard financeiro do restaurante
- Fase 7: antecipacao de credito e expansoes

### 6. Backlog tecnico priorizado

Gere um backlog com prioridade `P0`, `P1` e `P2`, separando:

- banco de dados
- backend
- frontend
- integracao Asaas
- seguranca
- observabilidade
- testes
- operacao/suporte

### 7. Setup local do Asaas no PC

Descreva como configurar localmente o ambiente do projeto para testar Asaas, sem expor segredos reais. Inclua:

- variaveis de ambiente necessarias
- valores de exemplo
- uso de sandbox
- webhook token
- uso de `ngrok`
- como apontar o webhook local
- como validar o endpoint `/api/v1/cheffia/OrderHub/webhook/asaas`
- quais scripts do projeto ja podem ser usados
- o que ainda precisa ser criado no projeto para esse setup ficar completo

### 8. Primeira execucao recomendada

Ao final, proponha a primeira etapa pratica que deve ser executada agora no codigo, com justificativa curta.

## Regras importantes

- Nao assuma que o projeto esta pronto para white label completo.
- Nao proponha coexistencia duradoura com Stripe; a diretriz do projeto e remocao total.
- Nao proponha armazenar credenciais sensiveis sem sugerir criptografia/segregacao.
- Nao trate dashboard financeiro como apenas UI; ele deve nascer de um dominio conciliavel.
- Sempre deixe claro quando a recomendacao depende de configuracao comercial previa com o Asaas.
- Se algum fluxo depender de decisao de produto, indique isso explicitamente.
- Sempre que possivel, prefira processos automaticos e rapidos para onboarding.
- Se identificar ausencia de dados obrigatorios no cadastro atual, proponha como capturar esses dados sem quebrar o onboarding atual.

## Formato final esperado

Quero uma resposta altamente pratica, com foco em execucao real neste repositorio, e nao uma explicacao generica sobre o Asaas.

Se houver conflitos entre o estado atual do codigo e o objetivo desejado, aponte esses conflitos antes de propor a implementacao.
