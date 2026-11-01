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

## Planos e Preços

O Cheffia opera em três planos de assinatura, sem fidelidade, pagos via Stripe Billing (cartão recorrente ou PIX de ciclo único):

### Features por plano

| | **Básico** | **Pro** | **Complete** |
|---|---|---|---|
| Cardápio digital QR | ✓ | ✓ | ✓ |
| Pedidos automatizados | ✓ | ✓ | ✓ |
| Kitchen Hub | ✓ | ✓ | ✓ |
| Gestão de mesas | ✓ | ✓ | ✓ |
| Relatórios | ✓ | ✓ | ✓ |
| Reservas | — | ✓ | ✓ |
| Fila de espera | — | — | ✓ |
| Integração Google | — | — | ✓ |
| URL do menu | `restaurante.cheffia.app` | `restaurante.cheffia.app` | Domínio próprio |
| **NFC (add-on)** | pós-MVP | pós-MVP | pós-MVP |

### Preços por ciclo de cobrança

| Ciclo | **Básico** | **Pro** | **Complete** | Desconto |
|---|---|---|---|---|
| **Mensal** | R$ 99/mês | R$ 149/mês | R$ 249/mês | — |
| **Trimestral** | R$ 270/tri | R$ 400/tri | R$ 670/tri | ~9% |
| **Semestral** | R$ 480/sem | R$ 720/sem | R$ 1.200/sem | ~19% |
| **Anual** | R$ 900/ano | R$ 1.340/ano | R$ 2.240/ano | ~24% |

Setup: R$ 0 (onboarding gratuito). Sem trial. Sem reembolso no cancelamento.

**Complete é roadmap pós-MVP.** MVP lança com Básico + Pro.

### MVP inicial

- Cardápio digital por restaurante e mesa.
- Hub público com identidade do restaurante (logo, capa, tagline e CTA) em subdomínio `restaurante.cheffia.app`.
- Acesso por QR e NFC com QR como fallback.
- Modo visual opcional do cardápio, sempre acompanhado de modo lista acessível.
- Criação de pedido pelo cliente.
- Entrega do pedido à operação de cozinha em tempo real.
- Atualização e acompanhamento do status do pedido.
- Avaliação pós-entrega com nota, tags rápidas e comentário opcional.
- Analytics mínimo do funil de entrada até pedido e avaliação.
- Gestão de cardápio, mesas, QR code e operação pelo restaurante.
- Reservas (plano Pro).
- Assinatura e cobrança via Stripe Billing.

### Fora do MVP inicial (Complete — roadmap)

- Fila de espera.
- Integração Google (Reserve with Google).
- Domínio próprio para o menu digital.
- Split de pagamento ou repasse a restaurantes.

### Backlog técnico associado

- Wildcard DNS `*.cheffia.app` + middleware de roteamento por tenant no Next.js (necessário para subdomínios dinâmicos de todos os planos).

### Restrições técnicas confirmadas

- O produto está migrando de frontend Next.js + backend .NET separados para um app full-stack em Next.js.
- Supabase é a base prevista para Auth, Postgres, Storage e Realtime.
- Prisma é usado para schema e migrations.
- Atualizações operacionais devem usar Outbox + Supabase Realtime, não um servidor de WebSocket próprio hospedado em funções Vercel.
- As novas interfaces devem seguir a arquitetura feature-local e os tokens de `app/globals.css`.

## Fases de Desenvolvimento

### Fase 0 — Fundação ✅ concluída
- Migração full-stack para Next.js (frontend + backend unificados)
- Supabase Auth, Postgres, Storage e Realtime
- Prisma schema + migrations
- RLS e isolamento por tenant
- CI/CD básico

### Fase 1 — Ordering vertical slice ✅ concluída (M5 pendente: smoke + promoção)
- Cardápio digital por restaurante e mesa (publicado via QR/NFC)
- Hub público do restaurante (`restaurante.cheffia.app` — subdomain routing necessário)
- Acesso por QR com NFC como add-on
- Criação de pedido pelo cliente
- Kitchen Hub: recebimento e transição de estado em tempo real (Outbox + Supabase Realtime)
- Acompanhamento de status pelo cliente
- Gestão de mesas e QR codes pelo restaurante
- Cobertura: unit 91%, frontend 91%, E2E 100%

### Fase 2 — Auth + Assinatura 🔄 em andamento (`feature/m4-auth-assinatura`)
- Autenticação de restaurantes (Supabase Auth — cadastro, login, reset)
- Stripe Billing: assinatura dos planos Básico (R$99) e Pro (R$149)
- Pagamento: cartão recorrente + PIX de ciclo único
- Feature gating por plano (Pro habilita reservas)
- Onboarding do restaurante via Stripe Connect (`accounts.create`)
- Setup gratuito; sem trial; sem fidelidade

### Fase 3 — Reservas + Subdomain routing 📋 MVP, não iniciada
- Reservas de mesa (plano Pro)
- Wildcard DNS `*.cheffia.app` + middleware de roteamento por tenant no Next.js
- Subdomínios dinâmicos `restaurante.cheffia.app` para todos os planos

> **MVP = Fases 0 + 1 + 2 + 3.** Lançamento após Fase 3 completa com planos Básico + Pro.

### Fase 4 — Relatórios e Analytics 📋 pós-MVP
- Relatórios por restaurante (faturamento, pedidos, itens mais vendidos)
- Analytics do funil cliente (entrada → pedido → avaliação)

### Fase 5 — Pagamento de comanda 📋 pós-MVP
- Stripe Payment Element na comanda do cliente (Apple Pay, Google Pay, cartão)
- Stripe Connect para split de pagamento restaurante/Cheffia
- PIX direto na conta do restaurante como fallback (se MCC 5813 bloquear)

### Fase 6 — Plano Complete + NFC 📋 pós-MVP
- Fila de espera digital
- Integração Google (Reserve with Google)
- Domínio próprio para o menu digital
- **Add-on NFC comanda:** tags reutilizáveis por cliente (qtd = capacidade do restaurante), leitura por garçom/caixa em qualquer dispositivo NFC, consulta de pedido individual em mesa com múltiplos clientes, pagamento no app ou físico no caixa; modo premium sem QR (cliente toca tag → menu direto)

### Add-on NFC (todos os planos — Fase 6, pós-MVP)

O add-on NFC evolui o produto para dois modos simultâneos:

- **Modo premium sem app:** cliente toca a tag NFC → acessa menu e acompanha pedido diretamente, sem QR scan. Experiência mais refinada para restaurantes que querem eliminar o QR code.
- **Modo comanda digital:** garçom ou caixa toca a tag do cliente em qualquer dispositivo NFC → consulta pedido individual em tempo real, mesmo em mesa com múltiplos clientes. Pagamento: pelo app ou o operador cobra fisicamente após a leitura.

**Operação:**
- Restaurante recebe kit de tags reutilizáveis (quantidade = capacidade do estabelecimento)
- Cada cliente recebe uma tag ao sentar; devolve ao sair
- Tags NTAG213 reutilizáveis por sessão; qualquer dispositivo NFC lê (Android/iOS)
- QR code é sempre o fallback incluso em todos os planos, sem custo adicional

**Precificação (a fechar na Fase 6):**
- Mensalidade do serviço: a definir (escopo de comanda digital justifica valor maior que R$49)
- Hardware: kit one-time baseado na capacidade do restaurante (cotação em lote)

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

## Interface Context for Design Work

- O Cheffia reúne superfícies com objetivos diferentes: descoberta/marketing, pedido do cliente, execução da cozinha e gestão do restaurante. Determine o objetivo da rota e a tarefa do usuário antes de escolher uma abordagem visual; não aplique um único padrão de página a todo o produto.
- Em telas de operação, priorize contexto correto do pedido, leitura rápida, ações claras, prevenção de erro e estados recuperáveis. Em páginas persuasivas ou de apresentação, a composição pode variar desde que preserve fatos, identidade e fluxo real do produto.
- Não invente funcionalidades, dados, disponibilidade, métricas, preços, depoimentos ou evidências de clientes. Quando o conteúdo ou comportamento necessário não estiver confirmado por este arquivo, especificações do produto ou implementação real, marque a lacuna e pergunte antes de apresentá-lo como fato.
- O sistema visual oficial está documentado em `DESIGN.md` e no Figma CHEFFIA 2.0; este arquivo define contexto e compromissos de produto, não substitui essas referências visuais.

## Accessibility & Inclusion

- O fluxo do cliente deve funcionar em smartphone sem exigir aplicativo instalado.
- As interfaces precisam preservar contraste, foco visível, controles com rótulos e navegação por teclado nas superfícies aplicáveis.
- Estados de pedido não podem depender apenas de cor; devem ter texto e semântica explícitos.
