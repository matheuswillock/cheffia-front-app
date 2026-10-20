# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

O Cheffia atende três públicos que participam de um único fluxo operacional:

- **Cliente na mesa:** acessa o hub do restaurante por QR/NFC, consulta o cardápio, monta o pedido, acompanha seu estado e pode avaliar a experiência após a entrega.
- **Equipe de cozinha/operação:** recebe os pedidos, organiza o preparo e atualiza o andamento com clareza e velocidade.
- **Dono ou gerente do restaurante:** configura cardápio e mesas, acompanha a operação e garante que o estabelecimento use o fluxo de pedidos de forma confiável.

Nenhum desses públicos deve ser tratado como secundário na experiência do MVP: o valor do produto depende da passagem correta de contexto entre os três.

## Product Purpose

Cheffia é um SaaS para bares e restaurantes que torna o pedido na mesa uma operação digital rastreável: o cliente consulta o cardápio, envia o pedido, a cozinha recebe o trabalho e o restaurante acompanha o seu andamento.

O sucesso inicial é o restaurante conseguir operar o ciclo mesa → pedido → cozinha → status com menos interrupções, erros de comunicação e dependência de processos manuais.

## Positioning

O compromisso central do produto é conectar a mesa à cozinha em um único fluxo operacional: um pedido iniciado pelo cliente precisa chegar à equipe certa, manter o contexto da mesa e avançar por estados visíveis para toda a operação.

## Operating Context

- Restaurantes, bares e operações de atendimento em mesa.
- Cliente usa o próprio celular, normalmente após tocar um cartão NFC ou ler um QR code vinculado ao estabelecimento/mesa.
- Cozinha ou equipe de preparo precisa consultar e executar pedidos em um ambiente de operação rápida.
- Dono ou gerente configura cardápio, identidade pública, QR/NFC e acompanha a operação e feedback pelo portal do restaurante.
- O produto é multi-tenant: dados e operações de cada restaurante precisam permanecer isolados.

## Capabilities and Constraints

### MVP inicial

- Cardápio digital por restaurante e mesa.
- Hub público com identidade do restaurante (logo, capa, tagline e CTA).
- Acesso por QR e NFC com QR como fallback.
- Modo visual opcional do cardápio, sempre acompanhado de modo lista acessível.
- Criação de pedido pelo cliente.
- Entrega do pedido à operação de cozinha em tempo real.
- Atualização e acompanhamento do status do pedido.
- Avaliação pós-entrega com nota, tags rápidas e comentário opcional.
- Analytics mínimo do funil de entrada até pedido e avaliação.
- Gestão mínima de cardápio, QR code e operação pelo restaurante.

### Fora do MVP inicial

- Pagamento dentro do app.
- Split de pagamento ou repasse a restaurantes.

Esses fluxos continuam como decisões futuras. A linha de migração contém trabalho técnico com Asaas, PIX, conta financeira e ledger, mas split e transferência não estão implementados ponta a ponta e não devem ser oferecidos como funcionalidade pronta.

### Restrições técnicas confirmadas

- O produto está migrando de frontend Next.js + backend .NET separados para um app full-stack em Next.js.
- Supabase é a base prevista para Auth, Postgres, Storage e Realtime.
- Prisma é usado para schema e migrations.
- Atualizações operacionais devem usar Outbox + Supabase Realtime, não um servidor de WebSocket próprio hospedado em funções Vercel.
- As novas interfaces devem seguir a arquitetura feature-local e os tokens de `app/globals.css`.

## Brand Commitments

- Nome do produto: **Cheffia**.
- A identidade existente usa uma linguagem escura, direta e tecnológica, com verde de marca como cor de ação.
- A referência `CHEFFIA 2.0.fig` e o sistema já implementado em `app/globals.css` são compromissos de marca existentes a preservar em extensões; eles não especificam por si só os fluxos operacionais do produto.

## Evidence on Hand

- Repositório atual: `cheffia-front-app`.
- Backend histórico: `cheffia-backend`.
- Referência visual local: `/home/matheuswillock/Downloads/CHEFFIA 2.0.fig`.
- Documentação operacional consolidada no espaço `Cheffia/` do Obsidian.

Ainda não há evidências aprovadas de métricas, clientes, depoimentos, preços ou benchmarks. Nenhum trabalho futuro deve fabricar esse tipo de prova.

## Product Principles

1. **O pedido não pode perder contexto:** mesa, itens, observações e estado precisam permanecer claros ao longo de todo o ciclo.
2. **A operação prevalece sobre a ornamentação:** durante atendimento e preparo, clareza, velocidade e prevenção de erro vêm antes de expressão visual.
3. **Cada público recebe apenas a complexidade que precisa:** cliente pede, cozinha executa e gerente configura/acompanhamento sem sobrecarregar as telas.
4. **Estados reais, não aparências de estado:** menu, pedido e status só são considerados prontos quando conectados a dados e eventos confiáveis.
5. **Financeiro exige confiança verificável:** pagamentos só entram no produto quando criação, confirmação, estorno, repasse e conciliação forem comprovadamente seguros.

## Accessibility & Inclusion

- O fluxo do cliente deve funcionar em smartphone sem exigir aplicativo instalado.
- As interfaces precisam preservar contraste, foco visível, controles com rótulos e navegação por teclado nas superfícies aplicáveis.
- Estados de pedido não podem depender apenas de cor; devem ter texto e semântica explícitos.
