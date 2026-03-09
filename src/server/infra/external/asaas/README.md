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
- `ASAAS_INITIAL_DOCUMENT_SYNC_ENABLED` (opcional, default: `true`)
- `ASAAS_INITIAL_DOCUMENT_SYNC_DELAY_MS` (opcional, default: `15000`)
- `ASAAS_DEFAULT_SETTLEMENT_STRATEGY` (opcional, `split_automatico` ou `transferencia_posterior`)
- `ASAAS_DEFAULT_PLATFORM_FEE_TYPE` (opcional, `percentage` ou `fixed`)
- `ASAAS_DEFAULT_PLATFORM_FEE_VALUE` (opcional, default: `0`)
- `ASAAS_DEFAULT_TRANSFER_DELAY_DAYS` (opcional, default: `0`)
- `ASAAS_MAIN_WALLET_ID` (opcional, usado quando a estrategia for `transferencia_posterior`)
