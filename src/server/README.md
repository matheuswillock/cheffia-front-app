# Server (backend migration)

Camadas base para a migracao incremental:
- `domain`: regras de negocio puras
- `application`: use cases e orquestracao
- `infra`: adaptadores externos (db, storage, asaas, realtime)
- `shared`: contratos comuns (errors, output, tenant context, idempotency)
