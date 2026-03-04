# NGROK_WEBHOOK_LOCAL.md

Objetivo: expor o endpoint de webhook local para o Asaas durante testes em desenvolvimento.

## Pre-requisitos
- `ngrok` instalado na maquina.
- `ngrok` autenticado (`ngrok config add-authtoken <SEU_TOKEN>`).
- App Next rodando localmente na porta `3000`.

## Scripts adicionados
- `bun run ngrok:webhook`: abre tunel HTTP -> `localhost:3000`.
- `bun run ngrok:webhook:url`: imprime URL completa do webhook usando o path padrao.
- `bun run webhook:local:url`: imprime URL completa para `/api/v1/cheffia/OrderHub/webhook/asaas`.

## Fluxo recomendado de teste local
1. Terminal 1:
```bash
bun run dev
```

2. Terminal 2:
```bash
bun run ngrok:webhook
```

3. Terminal 3:
```bash
bun run webhook:local:url
```

4. Copie a URL retornada e configure no painel do Asaas como webhook `POST`.

## Observacoes importantes
- A URL do ngrok muda a cada execucao (plano gratuito), entao precisa atualizar no Asaas quando reiniciar o tunel.
- O script `webhook:local:url` depende da API local do ngrok em `http://127.0.0.1:4040/api/tunnels`.
- Se voce usar outro path de webhook:
```bash
node scripts/print-ngrok-webhook-url.mjs --path /seu/path
```
