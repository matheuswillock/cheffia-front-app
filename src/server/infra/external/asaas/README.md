# Asaas client

Cliente HTTP centralizado para Asaas com:
- timeout configuravel (`ASAAS_TIMEOUT_MS`)
- retries controlados (`ASAAS_MAX_RETRIES`)
- logs seguros com `requestId` e `tenantId`
- mapeamento de erro (`AsaasApiError`, `AsaasNetworkError`)

Variaveis esperadas:
- `ASAAS_API_KEY`
- `ASAAS_BASE_URL` (default: `https://sandbox.asaas.com/api/v3`)
- `ASAAS_TIMEOUT_MS` (opcional)
- `ASAAS_MAX_RETRIES` (opcional)
- `ASAAS_RETRY_BASE_DELAY_MS` (opcional)
