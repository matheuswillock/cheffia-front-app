# Idempotency module

Chave unica esperada: `tenant_id + method + endpoint + idempotency_key`.

Fluxo:
1. Procura registro existente.
2. Se ja finalizado, retorna resposta persistida (replay seguro).
3. Se em progresso, bloqueia concorrencia.
4. Se novo, cria `started`, executa handler e persiste `completed` ou `failed`.
