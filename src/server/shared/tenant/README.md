# Tenant Context

Resolucao obrigatoria de tenant por request:
- `x-tenant-id`
- `tenantId` em route/query
- claim JWT (`tenant_id`, `tenantId`, `https://cheffia.com/tenant_id`, `app_metadata.tenant_id`)
- fallback por `restaurantId` com resolver explicito

Se nao houver tenant valido, deve falhar com `TenantContextError`.
