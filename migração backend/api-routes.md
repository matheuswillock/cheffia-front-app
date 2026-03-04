# API Routes Inventory (v1 legado .NET)

Status: congelado para migracao incremental em `2026-03-04`.
Fonte de verdade: controllers em `A:\develop\cheffia-backend\cheffia-backend-webapi\Controllers\v1\*.cs` + `CheffiaControllerBase.cs`.

## Convencoes atuais do backend legado
- Prefixo base principal: `/api/v{version}/cheffia/[controller]` (ex.: `/api/v1/cheffia/Restaurant`).
- Versionamento: `Asp.Versioning` por segmento de URL.
- Envelope de resposta padrao (maioria das rotas): `Output<T>` com `isValid`, `successMessages`, `errorMessages`, `result`.
- Auth atual: `UseAuthentication()`/`UseAuthorization()`, mas sem `[Authorize]` nos controllers mapeados.
- Tenant atual: nao ha isolamento multi-tenant explicito; contexto inferido por `restaurantId`/`supabaseId`.

## Tabela de rotas
| Metodo | Path legado (.NET) | Controller.Action | Input | Output | Auth atual | Tenant (migracao) | Idempotencia (migracao) | Observacoes |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/v1/cheffia/Restaurant/{supabaseId}` | `RestaurantController.RequestRestaurantBySupabaseIdAsync` | `supabaseId` (route string) | `Output<OutputRestaurant>` | Publico | Obrigatorio | Nao obrigatoria | Busca por SupabaseId. |
| POST | `/api/v1/cheffia/Restaurant/register` | `RestaurantController.AddRestaurantAsync` | `InputRegisterRestaurant` (JSON) | `Output<OutputRegisterRestaurant>` | Publico | Obrigatorio | Recomendada (`Idempotency-Key`) | Cria restaurante + dados iniciais. |
| GET | `/api/v1/cheffia/Restaurant/confirm-email?token=` | `RestaurantController.ConfirmEmailAsync` | `token` (query) | `200 "Email confirmed successfully"` ou `400` | Publico | N/A | Nao obrigatoria | Nao usa envelope `Output<T>`. |
| DELETE | `/api/v1/cheffia/Restaurant/{restaurantId}/delete` | `RestaurantController.DeleteRestaurant` | `restaurantId` (route guid) | `Output<object?>` | Publico | Obrigatorio | Recomendada (`Idempotency-Key`) | Delete de dados do restaurante. |
| POST | `/api/v1/cheffia/Menu/items/add` | `MenuController.AddItemToMenuAsync` | `InputAddMenuItem` (`multipart/form-data`, inclui `IFormFile`) | `Output<OutputMenu>` | Publico | Obrigatorio | Recomendada (`Idempotency-Key`) | Upload de midia no fluxo atual (Cosmic). |
| DELETE | `/api/v1/cheffia/Menu/items/delete/{itemId}` | `MenuController.DeleteItemFromMenuAsync` | `itemId` (route guid) | `Output<object?>` | Publico | Obrigatorio | Recomendada (`Idempotency-Key`) | Remove item do menu. |
| GET | `/api/v1/cheffia/Menu/get?restaurantId=` | `MenuController.GetMenuByRestaurantIdAsync` | `restaurantId` (query guid) | `Output<OutputMenu>` | Publico | Obrigatorio | Nao obrigatoria | Leitura de menu. |
| GET | `/api/v1/cheffia/MenuLive?restaurantId=&table=` | `MenuLiveController.GetMenuLiveByRestaurantIdAsync` | `restaurantId` (query guid), `table` (query string) | `Output<MenuLiveOutput>` | Publico | Obrigatorio | Nao obrigatoria | `table` chega no endpoint mas nao e usado no use case atual. |
| GET (WebSocket upgrade) | `/api/v1/cheffia/OrderHub/connection/{restaurantId}/` | `OrderHubController.Connect` | `restaurantId` (route guid) + upgrade websocket | WebSocket stream / `400` | Publico | Obrigatorio | N/A | Nao suportado em Vercel Functions (precisa alternativa). |
| POST | `/api/v1/cheffia/OrderHub/send` | `OrderHubController.SendOrder` | `InputRequestOrder` (JSON) | `Output<SendOrderOutput>` | Publico | Obrigatorio | Obrigatoria (`Idempotency-Key`) | Envio de pedido para cozinha. |
| GET | `/api/v1/cheffia/OrderHub/order?restaurantId=&customerOrderId=` | `OrderHubController.GetOrdersByRestaurantId` | `restaurantId` + `customerOrderId` (query guid) | `Output<List<OrderOutput>>` | Publico | Obrigatorio | Nao obrigatoria | Consulta pedido. |
| POST | `/api/v1/cheffia/OrderHub/payment` | `OrderHubController.ProcessPayment` | `InputPaymentOrder` (JSON) | `Output<AbacatePayPixResponse>` | Publico | Obrigatorio | Obrigatoria (`Idempotency-Key`) | Gera cobranca PIX no AbacatePay. |
| POST | `/api/v1/cheffia/OrderHub/payment/confirmation` | `OrderHubController.ConfirmPayment` | `InputConfirmPixPayment` (JSON) | `Output<OutputConfirmPaymentStatus>` | Publico | Obrigatorio | Obrigatoria (`Idempotency-Key`) | Confirmacao de pagamento com provider. |
| POST | `/api/v1/cheffia/OrderHub/webhook/abacatepay?webhookSecret=` | `OrderHubController.Webhook` | `InputPaymentProcess` (JSON) + `webhookSecret` (query) | `200 "Webhook processado com sucesso."` | Assinatura fraca (query secret) | Obrigatorio | Obrigatoria (provider_event_id + tenant) | Segredo hardcoded no controller; processamento assinc com `Task.Run`. |
| POST | `/api/v1/cheffia/Payment/product/create` | `PaymentController.CreateProduct` | `InputPayProduct` (JSON inline controller) | `Output<object?>` | Publico | Obrigatorio | Recomendada (`Idempotency-Key`) | Stripe product + price. |
| POST | `/api/v1/cheffia/Payment/intent/create` | `PaymentController.CreatePaymentIntent` | `InputPayment` (JSON inline controller) | `Output<object?>` | Publico | Obrigatorio | Obrigatoria (`Idempotency-Key`) | Stripe payment intent. |
| POST | `/generate` | `PixPaymentsController.GeneratePixAsync` | `InputGeneratePixPayment` (JSON) | `Output<AbacatePayPixResponse>` | Publico | Obrigatorio | Obrigatoria (`Idempotency-Key`) | Inconsistente: sem prefixo `/api/v1/cheffia/...`. |
| POST | `/confirm` | `PixPaymentsController.ConfirmPixAsync` | `InputConfirmPixPayment` (JSON) | `Output<CheckPixStatusResponse>` | Publico | Obrigatorio | Obrigatoria (`Idempotency-Key`) | Inconsistente: sem prefixo `/api/v1/cheffia/...`. |
| GET | `/health` | `Program.MapGet("/health")` | sem input | `"Healthy"` | Publico | N/A | N/A | Healthcheck simples. |

## DTOs de entrada principais (legado)
- `InputRegisterRestaurant`: `Name`, `Address`, `PhoneNumber`, `Email`, `EmailVerified`, `SupabaseId`, `OwnerFullName`, `Document`, `ProviderAvatarUrl`.
- `InputAddMenuItem`: `Item` + `RestaurantId`.
- `InputItem`: `Name`, `Price`, `ItemMedia`, `Ingredients`, `CategoryId`, `Description`.
- `InputRequestOrder`: `CustomerOrderId`, `RestaurantId`, `TableNumber`, `OrderItems[]`.
- `InputRequestOrderItem`: `MenuItemId`, `Quantity`, `Comments`, `TableNumber`, `OrderStatus`.
- `InputPaymentOrder`: `CustomerOrderId`, `PayTip`.
- `InputConfirmPixPayment`: `PaymentPixId`.
- `InputPaymentProcess`: `data`, `devMode`, `event` (payload de webhook AbacatePay).
- `InputGeneratePixPayment`: `Amount`, `Description`.

## Inconsistencias detectadas (para tratar na migracao)
- `PixPaymentsController` nao herda `CheffiaControllerBase` e expoe rotas fora de `/api/v1/cheffia`.
- Webhook atual usa segredo hardcoded (`"seu_webhook_secret_aqui"`) em query string.
- Endpoint `OrderHub/connection` depende de WebSocket server-side (incompativel com Vercel Functions).
- `table` em `MenuLive` entra na rota mas nao e usado no fluxo atual.
- Rotas criticas sem `[Authorize]` e sem isolamento multi-tenant real no banco.

## Regra de congelamento para migracao
- O novo backend TS deve manter metodo/path/contrato de entrada e formato de resposta para compatibilidade inicial.
- Mudancas de contrato so com versionamento explicito e atualizacao desta tabela.
