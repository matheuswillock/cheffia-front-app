# Payment

Route Handlers migrados:
- `POST /Payment/intent/create` - wrapper compatível para criação de cobrança PIX no Asaas
- `POST /Payment/product/create` - endpoint legado mantido apenas para responder `410` após remoção do Stripe

As rotas exigem tenant context (`x-tenant-id`, claim JWT, `tenantId` no payload ou resolucao por `restaurantId`).
