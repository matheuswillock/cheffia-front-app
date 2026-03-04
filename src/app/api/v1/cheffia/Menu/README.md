# Menu

Pasta reservada para os Route Handlers do dominio `Menu`.
Contratos alvo: `/Menu/items/add`, `/Menu/items/delete/{id}`, `/Menu/get`.

Compatibilidade atual:
- `POST /Menu/get` tambem aceito (frontend legado envia body com `params.restaurantId`).
- `DELETE /Menu/items/delete?itemId=...` tambem aceito (frontend legado sem route param).

Storage de imagens:
- Upload de `Item.ItemMedia` via Supabase Storage.
- Namespace tenant-scoped: `tenant/{tenantId}/menus/{menuId}/items/...`.
