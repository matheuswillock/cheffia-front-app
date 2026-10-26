---
target: Cheffia landing page
total_score: 14
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
target_identity: "file:/home/matheuswillock/develop/cheffia-front-app/src/app/page.tsx"
target_fingerprint: "sha256:8be0c2475a82b7b180b0ef61e0a0935cf7a6f7bb10284ff0104a063b9b196832"
target_path: /home/matheuswillock/develop/cheffia-front-app/src/app/page.tsx
timestamp: 2026-10-23T15-57-59Z
slug: src-app-page-tsx
---
## Avaliação da landing page Cheffia

### Design Health

| # | Heurística | Nota | Evidência |
|---|---|---:|---|
| 1 | Visibilidade do estado | 2/4 | O cadastro fecha o modal imediatamente, sem confirmação visível do envio. |
| 2 | Correspondência com o mundo real | 2/4 | QR por mesa é concreto; subtítulo e promessas de gestão/pagamento são vagos ou não confirmados. |
| 3 | Controle e liberdade | 2/4 | Modais fecham com Escape e clique externo; CTA abre formulário extenso sem explicar o próximo passo. |
| 4 | Consistência e padrões | 1/4 | CTA de pergunta tem nome acessível de lista de espera; botões têm estilos e implementações paralelas. |
| 5 | Prevenção de erros | 2/4 | Formulários longos, campos obrigatórios em excesso e estados de erro desalinhados. |
| 6 | Reconhecimento em vez de recordação | 2/4 | Navegação nomeada, mas destino dos links do rodapé é vazio e ícone do WhatsApp tem alt de Instagram. |
| 7 | Flexibilidade e eficiência | n/a | Não é objetivo central de landing de persuasão. |
| 8 | Estética e minimalismo | 2/4 | Marca coesa, porém seções e benefícios repetem mensagens; brilho e destaques competem com a promessa. |
| 9 | Recuperação de erros | 1/4 | Erros inline existem, mas alguns campos apontam para erros de outros campos; envio não confirma resultado. |
| 10 | Ajuda e documentação | n/a | FAQ cobre dúvidas comerciais; documentação contextual não se aplica à landing. |
| **Total** |  | **14/32 (44%, fraco)** | Soma recalculada das notas individuais de Assessment A. |

### Veredito

A paleta escura e verde identifica Cheffia, mas a composição ainda poderia pertencer a qualquer SaaS de restaurante. A landing fala de reduzir erros, mas não demonstra claramente o ciclo que diferencia o produto: mesa, pedido, cozinha e status. A miniatura do Figma local mostra um board de identidade e componentes, com paleta e variações de botões. Ela não permite conferir a composição completa da landing nem validar o mapeamento exato de cada botão.

### O que funciona

- Verde de ação e fundo escuro preservam a identidade existente.
- Há uma ação principal recorrente, a lista de espera.
- O FAQ antecipa objeções de adoção, dificuldade e compatibilidade.

### Prioridades

1. **[P1] Promessas incompatíveis com o produto confirmado.** A landing e o FAQ anunciam pagamentos PIX/carteiras, estoque em tempo real, reservas e integrações não comprovadas no PRODUCT.md; pagamentos estão explicitamente fora do MVP. Ajustar alegações antes de promover conversão. `$impeccable clarify`.
2. **[P1] Conversão pede dados demais sem explicar o benefício.** A lista de espera exige oito campos, inclusive ticket médio e plataforma atual. Reduzir ao mínimo, deixar qualificação posterior e mostrar confirmação/erro de envio. `$impeccable shape`.
3. **[P2] Narrativa longa e redundante.** Funcionalidades, mockup, impacto, diferenciais e missão repetem eficiência sem provar o fluxo operacional. Organizar a narrativa como problema, demonstração do pedido chegando à cozinha, status visível e CTA. `$impeccable distill`.
4. **[P2] Sistema de botões inconsistente e acessibilidade divergente.** `ButtonCta.tsx` implementa botão próprio; formulários usam `ui/button.tsx` com classes sobrescritas e raios diferentes; CTA do FAQ diz “Faça uma pergunta”, recebe aria-label “Entrar na lista de espera” e abre o formulário de pergunta. Padronizar variante, tamanho, raio, foco, estados disabled/loading e nome acessível. `$impeccable harden`.

### Evidência visual e técnica

- Browser local em 1920x937 e 390x844. Desktop usa hero centralizado, verde forte e três cards; mobile empilha o hero e deixa o próximo card parcialmente visível no carrossel.
- A captura mostra barra de rolagem horizontal; confirmar e corrigir overflow global na página, distinguindo-o do carrossel intencional.
- Carrossel troca automaticamente a cada 4s sem controle visível de pausa.
- Cards de funcionalidades usam `onClick` em `div`, sem semântica de botão nem suporte evidente de teclado.
- Links do rodapé apontam para `href=""`; navegação tem alvo `#pricing`, mas a home não monta a seção de preços.
- Figma: arquivo local abriu e sua miniatura indica página de design system com tokens e opções de botões. Não houve inspeção do arquivo completo/frame a frame.
- Detector Impeccable: `[]`, 0 achados. Overlay visual não aplicado: o `detect.js` esperado não estava disponível na instalação; live-server foi encerrado.

### Plano de componentes

1. **Auditoria visual e contrato de conteúdo:** inventariar cada seção e alinhar copy, imagens e CTA ao Figma e ao PRODUCT.md. Confirmar com o usuário qual frame do arquivo representa a landing, pois a miniatura visível é um board de componentes.
2. **Primitivo Button:** reutilizar `src/components/ui/button.tsx` como base existente; fechar variantes semânticas (primary, secondary/outline, ghost, destructive), tamanho, radius de 6px da marca, foco, hover, active, disabled e loading usando tokens. Criar `ButtonLink`/uso `asChild` para navegação e manter `button` para ações. Não criar um segundo sistema paralelo. A política DESIGN.md pede Smooth UI, mas o projeto só mostra `components/smoothui/form`; confirmar a fonte oficial aplicável antes de novos primitives.
3. **Componentes da landing:** `LandingHeader` e `MobileNav`; `HeroSection`; `ProductFlow/OrderingDemo` como prova visual; `FeatureSection` com dados tipados e controles acessíveis; `WaitlistDialog` e `QuestionDialog` sobre `ui/dialog.tsx`; `WaitlistForm` e `QuestionForm`; `FaqAccordion` sobre o primitive existente; `LandingFooter` com destinos reais. Manter componentes de marketing isolados da UI operacional.
4. **Composição:** `src/app/page.tsx` limita-se a compor seções e estado de dialogs; remover duplicação de CTA passando uma intenção clara por prop; evitar página inteira como Client Component se apenas ilhas interativas precisarem de estado.
5. **Validação:** testes de componente para variantes/nomes acessíveis/foco/estados/diálogos, testes de formulários para erro, loading, sucesso e preservação de entrada, e Playwright para navegação e conversão em desktop/mobile. Capturas browser após implementação e teste de overflow, teclado, leitor de tela e contraste.

### Personas

- **Jordan, primeira visita:** não entende em poucos segundos o produto além de “cardápio”; CTA não explica o retorno e o FAQ apresenta funcionalidades não comprovadas.
- **Riley, stress tester:** nota conflito de promessas e links do rodapé sem destino; falhas de envio e de campos podem apagar dados sem confirmação.
- **Casey, mobile:** formulário longo e seis escolhas de porte aumentam esforço; carrossel automático pode deslocar conteúdo enquanto lê.

### Questões para decidir

- A prioridade agora é corrigir primeiro as promessas de produto, a conversão ou a consistência dos botões?
- O Figma contém um frame específico da landing além do board de tokens/componentes exibido na miniatura?
- No formulário, quais dados são realmente necessários antes do primeiro contato?
