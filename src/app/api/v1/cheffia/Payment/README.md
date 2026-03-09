# Payment

Route Handlers migrados:
- `POST /Payment/intent/create`
- `POST /Payment/product/create`

As rotas exigem tenant context (`x-tenant-id`, claim JWT, `tenantId` no payload ou resolucao por `restaurantId`).
