# OpenAPI v1 (Migration)

Artefatos gerados a partir das rotas reais em `app/api/v1/cheffia/**`.

## Comandos

```bash
bun run openapi:generate
```

O comando gera:

- `app/api/openapi/openapi.json`
- `postman/cheffia-v1.postman_collection.json`
- `postman/cheffia-v1.environment.json`
- `insomnia/cheffia-v1.openapi.json`

## Uso

1. Postman: importe `postman/cheffia-v1.postman_collection.json` e `postman/cheffia-v1.environment.json`.
2. Insomnia: use Import -> OpenAPI e selecione `insomnia/cheffia-v1.openapi.json`.
