# MIGRATION_TEST_MATRIX

Objetivo: validar ponta a ponta todas as implementacoes/migracoes concluidas ate agora (Tasks 01-14), com foco em contrato, multi-tenant e idempotencia.

## 0) Preparacao de ambiente

- [ ] `bun install` executado sem erro.
- [ ] `.env`, `.env.local`, `.env.development` normalizados e sem placeholders de senha.
- [ ] `bun run typecheck` verde.
- [ ] Supabase conectado (RLS ativa + migrations aplicadas).
- [ ] ngrok ativo e URL de webhook local atualizada no Asaas.

## 1) Contrato base (Tasks 01-04)

- [ ] Todas as rotas em `src/app/api/v1/cheffia/**` respondem no prefixo `/api/v1/cheffia`.
- [ ] Envelope `Output<T>` consistente em rotas JSON.
- [ ] TenantContext bloqueia requests sem tenant quando a rota exige.
- [ ] Rota com resolucao por `restaurantId`/`supabaseId` resolve tenant corretamente.

## 2) Supabase + Prisma + Idempotencia (Tasks 05-06)

- [ ] `bun run prisma:validate` verde no ambiente alvo.
- [ ] Tabelas com `tenant_id` e indices compostos existem no banco remoto.
- [ ] Tabela `idempotency_keys` persistindo primeira resposta de escrita.
- [ ] Retry com mesmo `Idempotency-Key` retorna mesmo resultado sem efeito duplicado.
- [ ] Retry com mesma chave e payload diferente e rejeitado/registrado corretamente.

## 3) Asaas client + webhook (Tasks 07-08)

- [ ] Cliente Asaas cria cobranca sem erro de autenticacao.
- [ ] Webhook valida token (`asaas-access-token`) e rejeita token invalido.
- [ ] Evento bruto + headers persistidos em `asaas_webhook_events`.
- [ ] Reenvio do mesmo evento nao duplica efeito de negocio (exactly-once logico).
- [ ] Evento fora de ordem/retry nao corrompe estado interno.

## 4) Vertical slice Restaurant (Task 09)

- [ ] `GET /Restaurant/{supabaseId}` retorna restaurante esperado.
- [ ] `POST /Restaurant/register` cria restaurante e tenant quando necessario.
- [ ] `GET /Restaurant/confirm-email?token=` confirma e-mail corretamente.
- [ ] `DELETE /Restaurant/{restaurantId}/delete` remove restaurante sem vazamento cross-tenant.

## 5) Vertical slice Menu + MenuLive + Storage (Tasks 10-11)

- [ ] `POST /Menu/items/add` salva item e upload no Supabase Storage.
- [ ] `DELETE /Menu/items/delete/{itemId}` remove item no tenant correto.
- [ ] `DELETE /Menu/items/delete?itemId=` (legado) continua funcional.
- [ ] `GET /Menu/get?restaurantId=` retorna menu filtrado por tenant.
- [ ] `POST /Menu/get` (legado) continua funcional.
- [ ] `GET /MenuLive?restaurantId=&table=` retorna payload compativel.
- [ ] Namespace de storage usa `tenant/{tenantId}/...`.

## 6) Vertical slice OrderHub + Payment (Task 12)

- [ ] `POST /OrderHub/send` cria/atualiza pedido e itens.
- [ ] `GET /OrderHub/order` retorna pedido correto por `restaurantId + customerOrderId`.
- [ ] `POST /OrderHub/payment` gera cobranca PIX.
- [ ] `POST /OrderHub/payment/confirmation` atualiza status sem duplicacao.
- [ ] `POST /Payment/intent/create` cria intent no Stripe.
- [ ] `POST /Payment/product/create` cria produto/preco no Stripe.

## 7) Realtime + Outbox (Task 13)

- [ ] Escrita de pedido/pagamento gera evento em `outbox_events`.
- [ ] Frontend `order-hub/[slug]` recebe eventos via Supabase Realtime.
- [ ] Filtro por tenant/restaurant impede consumo cross-tenant.
- [ ] Reconexao do cliente nao duplica cards/eventos na UI.
- [ ] Selecao de evento e painel de detalhes da UI funcionam com dados reais.

## 8) OpenAPI + Collections (Task 14)

- [ ] `bun run openapi:generate` gera `src/server/openapi/openapi.json`.
- [ ] Collection Postman gerada e importada sem erro.
- [ ] Environment Postman gerado e variaveis resolvidas.
- [ ] Import OpenAPI no Insomnia funcionando com `insomnia/cheffia-v1.openapi.json`.
- [ ] Rotas e metodos documentados batem com implementacao real.

## 9) Casos obrigatorios de seguranca (multi-tenant + idempotencia)

- [ ] Usuario/tenant A nao consegue ler/escrever dados do tenant B.
- [ ] Webhook duplicado nao cria pagamento duplicado.
- [ ] Retry de endpoint com `Idempotency-Key` nao repete side effects.
- [ ] Eventos realtime nao vazam entre restaurantes/tenants.

## Evidencias minimas por execucao

- [ ] Log/print do request e response por rota testada.
- [ ] IDs reais usados nos testes (`tenantId`, `restaurantId`, `customerOrderId`, `eventId`).
- [ ] Query SQL/print mostrando ausencia de duplicidade em eventos/pagamentos.
- [ ] Registro de data/hora e responsavel pela rodada de testes.
