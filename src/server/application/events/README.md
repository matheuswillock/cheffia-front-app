# Events (application)

Centraliza escrita no `outbox_events` para publcacao via Supabase Realtime.

Regras:
- o evento de dominio e gravado na mesma transacao da operacao principal
- payload sempre inclui `restaurantId` quando aplicavel
- status inicial `pending` para permitir replay/reprocessamento
