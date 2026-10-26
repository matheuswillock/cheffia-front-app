---
name: Cheffia
description: Sistema operacional de pedidos para conectar mesa, cozinha e restaurante.
colors:
  primary: "#01FBA1"
  primary-foreground: "#181818"
  background-dark: "#181818"
  background-light: "#EAEAEA"
  surface-dark: "#2D2D2D"
  surface-light: "#F2F2F2"
  text-dark: "#EAEAEA"
  text-light: "#181818"
  text-muted-dark: "#CDD0CF"
  text-muted-light: "#434343"
  border-dark: "#434343"
  border-light: "#CDD0CF"
  support-deep: "#3C7A63"
  support-muted: "#355047"
  focus: "#62FFC6"
  destructive: "#E70000"
typography:
  display:
    fontFamily: "Clash Display, sans-serif"
    fontSize: "52px"
    fontWeight: 600
    lineHeight: "52px"
    letterSpacing: "0"
  headline:
    fontFamily: "Clash Display, sans-serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: "32px"
    letterSpacing: "0"
  title:
    fontFamily: "Clash Display, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: "20px"
    letterSpacing: "0"
  body:
    fontFamily: "Inter Tight, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0"
  label:
    fontFamily: "Inter Tight, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "12px"
    letterSpacing: "0"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  7: "28px"
  8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    specification: "Usar a variante correspondente no Figma; não assumir raio, padding ou altura universais."
  button-outline:
    backgroundColor: "transparent"
    specification: "Usar a variante correspondente no Figma; não assumir raio, padding ou altura universais."
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
    height: "36px"
  card-default:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Cheffia

## Fonte de verdade e consulta obrigatória

O arquivo [CHEFFIA 2.0 no Figma](https://www.figma.com/design/AuL2Q3F2Sp00zcB84lyMzr/CHEFFIA-2.0) é a fonte visual de verdade. Consulte a página **DESIGN SYSTEM** para tokens e componentes e as páginas **MOBILE** e **DESKTOP** para composição e comportamento responsivo. Este documento registra princípios e tokens confirmados; não substitui a inspeção da variante Figma específica.

Antes de implementar ou alterar UI, confirme no Figma o componente, variante, estado e breakpoint relevantes. Não extrapole medidas de uma variante para as demais. Se a tela/variante não existir ou a referência estiver inacessível, não pare apenas para perguntar se pode propor: formule uma proposta claramente identificada como não confirmada pelo Figma, usando o contexto de `PRODUCT.md`, Impeccable e a pesquisa de reuso Smooth UI; aplique Taste somente quando pertinente. Peça aprovação antes de implementar. Pergunte antes de propor quando faltar um fato de produto ou comportamento que possa mudar materialmente a solução, ou quando fontes vigentes entrarem em conflito. Preserve componentes e tokens existentes e mantenha este documento atualizado quando uma decisão visual for confirmada.

`DESIGN.md` é a síntese revisável do sistema, não uma licença para preencher lacunas por inferência. `PRODUCT.md` descreve público, objetivos, contexto e restrições do produto. O código e os componentes existentes também são evidência; se houver conflito real entre código, documentação e Figma, identifique-o e resolva com a referência atual ou com o usuário, em vez de escolher silenciosamente. Metadados gerados para ferramentas são auxiliares e precisam permanecer coerentes com as decisões confirmadas aqui e no Figma.

## Overview

**Creative North Star: "Central de serviço"**

Cheffia deve parecer uma operação de atendimento bem orquestrada: clara quando há pressão, rápida sem ser apressada e precisa sem parecer fria. A interface organiza a passagem de contexto entre mesa, cozinha e gestão; sua presença visual precisa reforçar confiança operacional em vez de competir pela atenção.

O sistema parte de superfícies neutras escuras por padrão, tipografia de alta legibilidade e um único verde elétrico tratado como sinal. A marca aparece na precisão das relações — contraste, alinhamento, foco e estado — e não em efeitos decorativos. O tema claro é uma alternativa completa, não uma inversão improvisada.

**Key Characteristics:**
- Operacional, legível e orientado a estados.
- Escuro por padrão; claro por escolha do usuário.
- Verde reservado para decisão, foco, ativo e confirmação.
- Profundidade tonal, bordas discretas e sombra apenas quando a elevação é real.
- Movimento curto que explica mudança de estado ou continuidade.

## Colors

Uma paleta de alto contraste organiza a operação: neutros carregam a maior parte da tela, o verde identifica a ação relevante e cores de suporte explicam status sem disputar a hierarquia.

### Primary
- **Service Signal:** `primary` é o verde de marca. Use para ação primária, confirmação, foco, item selecionado e estado ativo.

### Secondary
- **Kitchen Support:** `support-deep` e `support-muted` sustentam áreas de apoio, seleção sutil e superfícies secundárias; nunca substituem o verde de ação.

### Tertiary
- **Exception Red:** `destructive` é reservado a erros, exclusões e ações destrutivas que exigem atenção imediata.

### Neutral
- **Night Operations:** `background-dark`, `surface-dark`, `text-dark`, `text-muted-dark` e `border-dark` são a base do tema padrão.
- **Day Operations:** `background-light`, `surface-light`, `text-light`, `text-muted-light` e `border-light` mantêm a mesma ordem hierárquica no tema claro.

**The Signal, Not Wallpaper Rule.** O verde primário identifica uma decisão ou estado que importa. Ele não deve preencher grandes áreas, decorar cards ou aparecer simultaneamente em ações concorrentes.

## Typography

**Display Font:** Clash Display, sans-serif
**Body Font:** Inter Tight, sans-serif

**Character:** Clash Display organiza a hierarquia e dá presença à marca; Inter Tight executa o trabalho operacional com leitura rápida. A combinação deve ser direta e disciplinada: display para orientar, corpo para informar e agir.

### Hierarchy
- **Display:** use `display` para hero e títulos de página de maior peso; não para tabelas, KDS ou estados densos.
- **Headline:** use `headline` para seções e marcos importantes.
- **Title:** use `title` para grupos operacionais e títulos de card.
- **Body:** use `body` para instruções, valores e conteúdo de leitura. Em textos longos, ampliar line-height localmente para preservar conforto.
- **Label:** use `label` para metadados, campos, estados curtos e controles compactos.

**The Read-Then-Act Rule.** Em superfícies operacionais, a informação deve ser compreendida antes que a marca seja percebida. Não usar escala display para criar dramatização em dados de pedido, status ou pagamento.

## Layout

O ritmo é baseado em uma escala de 4px. A referência Figma estabelece 12 colunas com margem de 80px e gutter de 40px no desktop de 1280px; no mobile de 360px, 4 colunas com margem de 32px e gutter de 20px.

Marketing pode usar mais respiro e composição assimétrica. Portal, menu, checkout, OrderHub e backoffice devem priorizar leitura por varredura: alinhamentos firmes, grupos semânticos, largura de linha controlada e prioridade visual explícita. Quando a tela exigir ação frequente, reduzir decoração antes de reduzir a área de toque ou a legibilidade.

## Elevation & Depth

Cheffia é plano por padrão. A profundidade vem de mudança tonal entre fundo, superfície, popover e sidebar, acompanhada de borda discreta. Sombras suaves já existem nos componentes base e devem ser usadas para overlays, cards interativos ou elementos momentaneamente elevados — não para separar cada bloco da tela.

### Shadow Vocabulary
- **Soft operational lift:** `shadow` e `shadow-sm` dos componentes compartilhados indicam superfície clicável, popover ou elevação contextual.
- **Marketing depth:** `drop-shadow-3xl` e `drop-shadow-4xl` são reservados a composição de marketing e mockups, não à UI diária.

**The Flat-by-Default Rule.** Se um elemento não está sobrepondo, não está interativo ou não precisa destacar-se temporariamente, ele não recebe sombra.

## Shapes

As formas são suaves e precisas. Use os raios definidos para cada componente no Figma: controles compactos, botões, superfícies e cards podem ter tratamentos diferentes. Bordas são finas e sem ornamento; não imponha um raio global nem descarte formatos de cápsula quando eles fizerem parte da variante especificada.

## Components

**Source policy:** Smooth UI is the mandatory source for new components and primitives. Search it first, use the closest suitable component as the base, and compose it with the Cheffia tokens and compatible shadcn/ui patterns. Do not recreate an equivalent primitive by hand. An exception requires explicit technical justification that no equivalent Smooth UI primitive exists.

### Buttons
- **Character:** comandos claros, compactos e fáceis de localizar.
- **Variants:** use a variante exata definida no Figma (primária, secundária, outline, estados e demais propriedades); `primary` usa `{colors.primary}` e `{colors.primary-foreground}` quando aplicável.
- **Shape / dimensions:** não há um único raio, altura ou padding universal. Siga os valores do componente e da variante selecionados no Figma, respeitando MOBILE/DESKTOP; não aplique automaticamente o raio global de controles compactos.
- **Hover / Focus:** hover reduz levemente a intensidade do fundo; foco usa `focus` por meio do ring compartilhado.
- **Secondary / Ghost / Outline:** mantêm a hierarquia com superfície neutra, borda ou mudança tonal. Não competir visualmente com o CTA primário.

### Cards / Containers
- **Character:** agrupam contexto, não decoram páginas.
- **Corner Style:** suave (`14px` em card base).
- **Background:** usa `card`/superfície do tema ativo.
- **Shadow Strategy:** plana em repouso; sombra apenas quando houver razão de elevação.
- **Border:** uma borda discreta separa a superfície sem criar ruído.
- **Internal Padding:** `24px` para cards gerais; compactar somente quando a tarefa exigir alta densidade.

### Inputs / Fields
- **Style:** altura padrão de `36px`, borda `input`, fundo transparente e raio de `6px`.
- **Focus:** ring de uma unidade na cor `focus`; não depender apenas da mudança de cor do texto.
- **Error / Disabled:** erro usa `destructive`; disabled diminui opacidade sem remover rótulo ou contexto.

### Navigation
- **Style:** rótulos em Inter Tight e estrutura de baixo ruído. O verde só marca seção atual, foco ou ação que move o usuário adiante.
- **Mobile:** navegação deve conservar área de toque e foco explícito; o menu da landing pode ocupar o viewport, mas fluxos operacionais devem preferir caminhos curtos e persistentes.

### Status operacional
- **Character:** estado compreensível em uma leitura curta.
- **Rule:** status combina texto, ícone quando útil e cor semântica. Nunca comunicar um estágio de pedido apenas pela cor.

## Do's and Don'ts

### Do:
- **Do** search Smooth UI before adding any new component or primitive, then compose its chosen component with Cheffia tokens.
- **Do** usar tokens semânticos de `app/globals.css` e primitives de `components/ui/**` antes de criar variações locais.
- **Do** reservar o verde de marca para ação, foco, confirmação e seleção.
- **Do** tratar telas de operação como ferramentas: estados, próxima ação e contexto devem ser escaneáveis.
- **Do** usar movimento curto somente quando ele indicar foco, abertura, mudança de estado ou continuidade; respeitar `prefers-reduced-motion`.
- **Do** manter contraste, rótulos, foco visível e áreas de toque adequadas em todos os temas.

### Don't:
- **Don't** transformar a interface em um dashboard genérico com gradientes decorativos, cards empilhados ou brilho sem função.
- **Don't** usar o verde primário como preenchimento recorrente de cards, fundos ou múltiplas ações concorrentes.
- **Don't** usar Clash Display como texto de dados densos, formulários ou estados operacionais.
- **Don't** introduzir HEX fixo em código de interface novo quando já existir um token semântico adequado.
- **Don't** animar apenas para dar vida à tela; toda animação deve comunicar uma mudança útil.
