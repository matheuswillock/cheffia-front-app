# Cheffia — instruções de desenvolvimento

## Marca e identidade visual

- Preserve a identidade visual oficial do Cheffia: use os logos, ícones e demais assets de marca existentes no projeto.
- Não invente, redesenhe nem substitua símbolos, wordmarks ou logos oficiais por ícones, texto estilizado ou marcas improvisadas; procure os assets oficiais antes de compor a interface.
- Se um asset necessário não existir, não crie um substituto que pareça oficial: sinalize a lacuna e peça orientação.

## Design system e Figma

- A fonte visual de verdade do projeto é o arquivo [CHEFFIA 2.0 no Figma](https://www.figma.com/design/AuL2Q3F2Sp00zcB84lyMzr/CHEFFIA-2.0), especialmente a página **DESIGN SYSTEM**. Consulte também **MOBILE** e **DESKTOP** para as regras específicas de cada breakpoint.
- Antes de assumir que existe documentação, leia `PRODUCT.md` e `DESIGN.md` no checkout atual. Ambos existem e são versionados neste projeto; confirme o conteúdo real em vez de confiar em memória, resumos ou arquivos de outro workspace. Se estiverem ausentes em outro checkout, não presuma seu conteúdo: use o fluxo Impeccable para criá-los após verificar os fatos e perguntar sobre lacunas relevantes.
- Antes de criar ou alterar uma interface, consulte o componente, variante, estado e escala correspondentes no Figma. Não deduza medidas ou estados a partir de outro componente nem aplique um estilo genérico por conveniência.
- Reutilize tokens, componentes e assets existentes no repositório e alinhe-os ao Figma. Não crie cores, raios, tipografia, espaçamentos, sombras, ícones ou variantes por improviso.
- Não generalize uma propriedade observada em uma variante para todo o sistema. Por exemplo, botões no Figma possuem variantes e tamanhos próprios; aplique o formato e as dimensões da variante que corresponde ao caso de uso e ao breakpoint.
- Se o Figma estiver inacessível ou não tiver a tela/variante necessária, não invente que há uma referência confirmada e não pare apenas para perguntar se pode propor. Elabore uma proposta contextualizada com Impeccable e, quando pertinente ao tipo de página, Taste; pesquise primeiro componentes, blocks e templates Smooth UI candidatos. Apresente a proposta como recomendação, não como especificação do Figma, e peça aprovação antes de implementar. Pergunte antes de propor apenas quando faltar um fato de produto, escopo ou comportamento cuja resposta possa mudar materialmente a solução. Se houver conflito real entre fontes, exponha-o e peça decisão.
- Mantenha `DESIGN.md` coerente com o Figma. Quando uma especificação antiga divergir do arquivo, consulte o Figma e atualize a documentação junto com a mudança; não perpetue valores obsoletos.

## Fluxo obrigatório de UI: Impeccable, Taste e Browser Harness

- Referências oficiais: [Impeccable Docs](https://impeccable.style/docs/), [catálogo de anti-padrões Impeccable](https://impeccable.style/slop/), [Taste docs](https://www.tasteskill.dev/docs#hero-discipline) e [Taste usage guide](https://www.tasteskill.dev/guide). Consulte a versão atual quando usar essas skills; este arquivo registra apenas o fluxo e as prioridades do Cheffia.
- Para trabalho de UI, use **Impeccable** como fluxo principal: consulte `PRODUCT.md`, `DESIGN.md`, código/componentes existentes e a página-alvo; use `shape` quando o problema ou escopo ainda precisar de definição, `critique` para recomendações de design sem alterar código, `audit` para relatório de problemas de implementação e comandos focados (`polish`, `layout`, `typeset`, `clarify`, `adapt`, `harden` etc.) para mudanças aprovadas. Não confunda critique com audit nem trate recomendações como autorização automática para mudar escopo.
- Antes de implementar ou aprovar uma tela, valide objetivo e conteúdo com `PRODUCT.md`, direção visual com Figma/`DESIGN.md`, reuso e restrições do projeto, estados relevantes e comportamento responsivo. Em uma crítica, preserve o que funciona e exponha dúvidas que alterariam a solução; implemente apenas correções solicitadas/aprovadas no escopo.
- Use **Taste** como ferramenta obrigatória e contextual em landing pages, marketing, portfólios e redesigns que se encaixem no escopo da skill. Para dashboards, tabelas e fluxos operacionais multi-etapa, não force suas convenções de página de marketing: aplique apenas princípios que façam sentido para a tarefa. As regras anti-slop são sinais para avaliar, não proibições que se sobrepõem à marca, ao produto, à acessibilidade ou ao Figma.
- Se Taste, Impeccable, seus detectores ou referências genéricas divergirem do Figma, de `PRODUCT.md`, dos componentes vigentes ou de uma decisão explícita do usuário, prevalecem as fontes específicas do projeto e a decisão do usuário. Não remova um padrão intencional só para satisfazer uma regra genérica; documente a exceção quando necessário.
- Use **Browser Harness** para inspecionar a interface renderizada e verificar as telas/estados alterados em desktop e mobile quando aplicável. Exercite o caminho principal e controles relevantes; combine essa evidência visual/interativa com testes automatizados e revisão do diff. Uma captura ou detector limpo, isoladamente, não aprova a tela.
- Separe os resultados: critique recomenda; audit relata defeitos de implementação; detector identifica padrões conhecidos; Browser Harness verifica a página real. Registre achados, correções e evidência de verificação. Se uma etapa não puder ser executada, informe a limitação em vez de declarar aprovação.
- Ao criar ou atualizar os contextos, use Impeccable `init` para contexto de produto e `document` para registrar/refrescar o sistema visual; revise toda saída contra as fontes autoritativas antes de aceitar. Não assuma que uma skill, arquivo gerado ou instalação existe: confirme no checkout/sessão.

## Idealização sem variante Figma e reuso Smooth UI

- Quando a tela ou variante não existir no Figma, siga em modo de proposta: leia o `PRODUCT.md`, `DESIGN.md`, instruções locais da feature, rotas e componentes existentes; identifique público, tarefa, conteúdo confirmado, estados, breakpoints e restrições. Use Impeccable `shape` para fechar o problema/escopo quando necessário e `critique` para produzir opções e trade-offs sem alterar código. Use Taste para superfícies de marketing/redesign que pertençam ao seu escopo; não aplique convenções de landing page a fluxos operacionais. Entregue a direção como proposta explicitamente não validada pelo Figma e obtenha aprovação antes da implementação.
- Pesquise o catálogo Smooth UI para cada nova primitiva ou peça de interface antes de criar equivalente: consulte **primitives**, **components**, **blocks** e **templates**, conforme o nível de composição necessário; confira o demo, API/props, estados, acessibilidade, dependências, licença e instruções de instalação do item exato. Verifique também `components/ui` e demais componentes locais para evitar duplicatas. O catálogo pode ajudar a idealizar uma composição mesmo quando a tela final não existe; escolha apenas itens que sirvam à tarefa e à identidade Cheffia.
- Reutilize o código do item escolhido (registry/cópia editável) apenas após conferir compatibilidade com React/Next, Bun, Tailwind, shadcn e arquitetura atuais do checkout. Não instale pacotes nem altere configuração só por causa do preview. Prefira adaptar estrutura e estilos aos tokens semânticos, componentes compartilhados e regras de `DESIGN.md`; não herde automaticamente cores, tipografia, raio, espaçamento, layout, conteúdo demonstrativo ou animação do Smooth UI. Documente uma exceção quando não houver equivalente adequado.
- Para ícones de interface, procure primeiro uma opção adequada em [Lucide Animated](https://lucide-animated.com/) e confirme nome, comportamento e disponibilidade; use-a apenas quando a animação comunicar feedback ou estado útil e respeitar `prefers-reduced-motion`. Se não houver opção apropriada, use o ícone estático correspondente de Lucide. Preserve o vocabulário e os assets de marca Cheffia; não substitua logos por ícones. Ícones decorativos devem ser ignorados por leitores de tela e ações apenas com ícone precisam de nome acessível.
- Antes de incluir imagens, procure assets aprovados e confirme se a imagem melhora entendimento, confiança ou hierarquia da tela; telas operacionais não recebem imagens decorativas por padrão. Não invente fotos de clientes, restaurantes, depoimentos, métricas, interfaces ou evidência de produto. Se uma imagem for realmente necessária e não houver asset adequado, proponha geração/criação de asset com origem e uso definidos; não gere nem altere um logo/wordmark oficial. Entregue imagens otimizadas e responsivas, com dimensões/recorte adequados e texto alternativo significativo (ou `alt=""` se puramente decorativas); não use URLs de imagem não verificadas ou placeholders como solução final.

## Testes e TDD

- Toda implementação nova deve começar por um teste que descreva o comportamento esperado.
- Todo bug deve começar por um teste de regressão **red** que reproduza o comportamento exato do problema.
- Depois do red, implementar a menor correção necessária e confirmar **green**.
- Refatorar somente depois do green e executar a suíte novamente.
- O teste do bug corrigido deve permanecer versionado permanentemente.
- Não aceitar correções sem teste, testes que validem apenas detalhes internos ou mocks que eliminem a fronteira que deveria ser validada.

## Camadas obrigatórias

- `bun run test` (`bun test tests/ci tests/unit`): regras de domínio, validações e casos de uso, sem banco.
- `bun run test:integration:local` (`tests/integration` e `tests/regressions`): repositórios, SQL, RLS e regressões contra o Supabase local (`bun run db:reset` antes). Esses testes apagam linhas e só rodam contra `127.0.0.1`/`localhost`.
- `bun run test:realtime:local` (`tests/integration/realtime-*.test.ts`): autorização de Broadcast privado (mesa e cozinha). Exige o stack local completo (Realtime, Auth, API gateway e PostgREST), não só o banco: o runner sobe o stack, aplica as migrations, exporta `API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `JWT_SECRET` e `DB_URL` ao processo de teste e remove containers e workdir ao final. Por isso `test:integration:local` ignora esses arquivos.
- Vitest + React Testing Library + user-event: componentes, hooks, formulários, estados de loading/erro/sucesso e acessibilidade do frontend.
- Playwright: fluxos E2E reais no Next.js, incluindo autenticação, onboarding, cardápio, carrinho, checkout, pedidos, cozinha e bloqueios de assinatura.
- Supabase local: migrations, RLS, autorização e isolamento por tenant.

Use testes unitários para regras rápidas, testes de integração para contratos entre camadas e Playwright para fluxos completos. Playwright e testes de componente são complementares; não substituir uma camada pela outra.

## Organização dos testes

```text
tests/
  unit/         # domínio e backend puro
  integration/  # repositórios, Prisma, Supabase local e RLS (precisam de banco)
  components/   # React Testing Library
  e2e/          # Playwright
  regressions/  # bugs corrigidos, identificados por issue (os que precisam de banco rodam junto da integração)
```

## CI e segurança

- O CI deve executar `bun run test`, `bun run test:components` e `bun run test:e2e` antes do build/deploy, `bun run test:integration:local` no job de banco e `bun run test:realtime:local` no job `Realtime integration`, em paralelo com o banco. Ambos são gates de promoção.
- O gate de cobertura (`bun run coverage:gate`) exige 90% em backend, frontend e E2E; a cobertura de backend conta só `tests/ci` e `tests/unit`.
- O job final do CI deve criar automaticamente PRs `feature/bugfix` → `develop` e `develop` → `main`, de forma idempotente.
- Testes de componentes, integração e E2E críticos devem ser gates de promoção.
- Testes não podem usar credenciais, dados ou serviços de produção.
- Mocks são permitidos somente nas fronteiras externas; o caminho interno deve ser validado com dependências reais ou Supabase local.
- Ao alterar comportamento, atualizar o teste no mesmo change set.

## Runtime e comandos

- Usar Bun para instalação e execução (`bun`, `bunx`); não usar npm, npx, yarn ou pnpm.
- Não executar migrations no startup da aplicação.
- Antes de declarar uma tarefa concluída, executar os testes afetados e os gates relevantes do CI.
