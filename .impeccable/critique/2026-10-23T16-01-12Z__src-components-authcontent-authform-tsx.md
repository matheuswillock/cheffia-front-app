---
target: Cheffia auth page
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/home/matheuswillock/develop/cheffia-front-app/src/components/AuthContent/AuthForm.tsx"
target_fingerprint: "sha256:9920009ca2086638abe1232a9aebe5c0867c434fe283f93e80b9eaddbf100493"
target_path: /home/matheuswillock/develop/cheffia-front-app/src/components/AuthContent/AuthForm.tsx
timestamp: 2026-10-23T16-01-12Z
slug: src-components-authcontent-authform-tsx
---
# Cheffia sign-in — Impeccable critique

## Design Health Score

| # | Heurística | Nota | Evidência principal |
|---|---|---:|---|
| 1 | Visibilidade do estado do sistema | 2/4 | O botão exibe “Aguarde...” e erros aparecem; faltam estados de recuperação/sucesso observados. |
| 2 | Correspondência com mundo real | 3/4 | Texto contextualiza restaurantes; “Email” e “Senha” são familiares. |
| 3 | Controle e liberdade | 2/4 | Alternância login/cadastro e revelar senha existem; não há recuperação de senha visível. |
| 4 | Consistência e padrões | 3/4 | Campos rotulados e ação primária seguem convenções; sem inconsistência grave observada. |
| 5 | Prevenção de erros | 3/4 | Validação de email/senha e revelar senha reduzem erros de entrada. |
| 6 | Reconhecimento em vez de recordação | 3/4 | Rótulos, placeholders e alternância estão visíveis; recuperação não está. |
| 7 | Flexibilidade e eficiência | 2/4 | Caminho principal é curto, mas não há atalhos ou alternativa de acesso visível. |
| 8 | Estética e minimalismo | 3/4 | Composição focada, mas textos auxiliares pequenos e com baixo contraste. |
| 9 | Reconhecer, diagnosticar e recuperar de erros | 2/4 | Erro de autenticação é genérico e não oferece um próximo passo específico. |
| 10 | Ajuda e documentação | 1/4 | Não há ajuda ou recuperação de conta visível. |
| **Total** |  | **24/40 — Aceitável** | Melhorias necessárias antes de considerar a experiência aprovada. |

## Especificidade e detector

A página preserva a paleta escura, o verde de ação, tipografia e contexto mesa-cozinha da Cheffia. O login ainda é relativamente convencional, e uma lacuna funcional importante — recuperação de senha — impede uma aprovação de UX. A análise automatizada encontrou **0 achados** na varredura estática, mas a evidência visual do navegador sinalizou **LOW CONTRAST TEXT** sobre o formulário; portanto, resultado limpo do detector não equivale a aprovação visual.

## O que funciona

- Hierarquia direta: título, dois campos e uma ação principal bem evidente.
- Contexto textual do restaurante torna a página mais própria do produto.
- Rótulos, autocomplete, foco e controle de mostrar senha dão suporte à entrada.

## Questões prioritárias

1. **[P1] Recuperação de senha ausente.** Quem esqueceu a senha não tem próximo passo. Adicionar “Esqueceu sua senha?” junto ao campo e fluxo com confirmação/erro acionável. Sugestão: `$impeccable harden`.
2. **[P2] Contraste/legibilidade de textos auxiliares.** O overlay visual detectou baixo contraste; aviso legal e textos muted parecem pequenos. Elevar contraste e tamanho mínimo sem competir com o CTA. Sugestão: `$impeccable typeset`.
3. **[P2] Erro de autenticação sem recuperação específica.** A mensagem genérica preserva os dados, mas não explica a ação útil seguinte. Orientar sem revelar detalhes sensíveis e incluir reset de senha. Sugestão: `$impeccable clarify`.

## Carga cognitiva

Baixa, com **1 falha** no checklist: recuperação progressiva não está disponível quando necessária. O foco principal é único, os campos são agrupados e as decisões visíveis ficam abaixo de quatro opções.

## Personas

- **Jordan (primeiro acesso):** entende o primeiro passo, mas fica sem saída ao esquecer a senha.
- **Sam (acessibilidade):** labels e alerta existem; o overlay apontou baixo contraste. Navegação completa por teclado/contraste AA ainda precisa de verificação específica.
- **Casey (mobile):** viewport 390×844 manteve largura sem overflow (390px), com logo oficial e formulário visível; inspeção visual mobile confirma layout compacto. A interrupção não preserva progresso entre sessões.

## Observações menores

- “Criar conta” aparece na alternância superior e novamente no link inferior, gerando redundância leve.
- O texto de termos/privacidade é muito pequeno.

## Perguntas

- Quando o login falha, qual próximo passo deve estar imediatamente disponível além de tentar novamente?
- O texto legal deve continuar discreto ou ser aumentado para leitura confortável?
