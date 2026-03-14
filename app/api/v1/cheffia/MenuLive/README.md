# MenuLive

Pasta reservada para os Route Handlers do dominio `MenuLive`.
Realtime sera implementado com Supabase Realtime + Outbox (sem WebSocket server proprio na Vercel).

Rota implementada: `GET /MenuLive?restaurantId=&table=` (campo `table` mantido por compatibilidade, sem uso no fluxo atual).
