# Webhooks (application)

Modulo para processamento de webhooks externos com foco em:
- validacao de seguranca
- persistencia de payload bruto + headers
- deduplicacao idempotente por `tenant + provider + provider_event_id`
- processamento reentrante e seguro para retries
