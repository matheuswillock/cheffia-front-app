# OrderHub

Route Handlers migrados:
- `POST /OrderHub/send`
- `GET /OrderHub/order`
- `POST /OrderHub/payment`
- `POST /OrderHub/payment/confirmation`
- `POST /OrderHub/webhook/asaas`
- `POST /OrderHub/print/jobs/claim`
- `POST /OrderHub/print/jobs/complete`
- `POST /OrderHub/print/jobs/reprint`

Observacao: `GET /OrderHub/connection/{restaurantId}` (WebSocket legado) nao e suportado em Vercel Functions.
