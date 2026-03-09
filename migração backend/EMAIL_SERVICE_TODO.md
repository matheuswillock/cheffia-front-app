# EMAIL_SERVICE_TODO.md

Objetivo: implementar um servico transacional de disparo de e-mails no `cheffia-front-app`, usando `Resend` como provider inicial, com arquitetura server-side centralizada, templates proprios e integracao com `Supabase Auth` para geracao/validacao de links sensiveis.

Decisao de provider adotada: **Resend**.

Decisao de escopo inicial adotada: **Transacional core**.

Escopo inicial desta frente:
- `forgot password`
- `email confirmation`
- `welcome email` para novo usuario com onboarding minimo concluido
- base arquitetural para futuros convites/notificacoes essenciais

Decisao de confirmacao de e-mail adotada: **Supabase Auth como fonte de verdade + Resend apenas como camada de entrega/template**.

## Implementacao de referencia consultada no `lead-flow-app`
- `lead-flow-app/lib/email.ts`
- `lead-flow-app/lib/services/EmailService.ts`
- `lead-flow-app/app/api/v1/auth/forgot-password/route.ts`

Padrao observado na referencia:
- cliente `Resend` isolado em modulo proprio
- `EmailService` centralizado com metodos por caso de uso
- templates HTML/text gerados no backend
- uso de `supabase.auth.admin.generateLink(...)` para `recovery`
- suporte a modo de teste com redirecionamento de envio
- logs de erro e resposta segura para fluxos sensiveis

## Estado atual do `cheffia-front-app`
- Dependencia `resend` adicionada ao `package.json`.
- Camada server-side criada em `src/server/infra/external/email/**` e `src/server/application/email/**`.
- Fluxos `forgot password`, `resend confirmation` e `welcome email` conectados ao app.
- `Supabase Auth` permanece como fonte de verdade para confirmacao; `restaurants.email_verified` agora e sincronizado em `auth/callback`, `auth/confirm` e `register restaurant`.
- O fluxo legado por `verification_code` em `Restaurant/confirm-email` continua apenas como compatibilidade temporaria.

- [x] 01. Consolidar dependencia, env vars e convencoes de envio
Definicao de pronto: dependencia `resend` prevista no `package.json`; variaveis `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` opcional, `EMAIL_TEST_MODE`, `RESEND_OWNER_EMAIL` e `NEXT_PUBLIC_APP_URL` documentadas; convencao de remetente e naming dos envs fechadas.
Arquivos/paths envolvidos: `package.json`, `.env`, `.env.local`, futuro `src/server/infra/external/email/resendClient.ts`, `migração backend/EMAIL_SERVICE_TODO.md`.
Riscos/observacoes: sem `EMAIL_FROM` consistente a entrega fica fragil; sem helper de URL absoluta os links quebram em preview/producao; `EMAIL_TEST_MODE` deve existir desde o inicio para homologacao segura.
Nota multi-tenant/idempotencia: credenciais do provider sao centralizadas, mas o conteudo dos e-mails de negocio deve sempre carregar contexto de tenant/restaurante quando aplicavel.

- [x] 02. Criar cliente Resend server-only e camada de infraestrutura
Definicao de pronto: modulo dedicado criado para encapsular `new Resend(process.env.RESEND_API_KEY)`, validar env obrigatoria e impedir uso em client-side; a camada de infra deve ser simples e sem logica de template.
Arquivos/paths envolvidos: futuro `src/server/infra/external/email/resendClient.ts`, futuro `src/server/infra/external/email/types.ts`.
Riscos/observacoes: instanciar provider em varios pontos aumenta acoplamento e dificulta teste; nao usar essa camada fora de `runtime = "nodejs"`.
Nota multi-tenant/idempotencia: a infraestrutura de envio e global, mas nunca deve inferir tenant por conta propria; o contexto vem da camada de aplicacao.

- [x] 03. Criar `EmailService` centralizado no backend do app
Definicao de pronto: modulo de aplicacao previsto em algo como `src/server/application/email/emailService.ts`, com interface unica para `sendPasswordResetEmail`, `sendEmailConfirmationEmail`, `sendWelcomeEmail` e `sendGenericEmail`; retorno padronizado com `success`, `data` e `error`.
Arquivos/paths envolvidos: futuro `src/server/application/email/emailService.ts`, futuro `src/server/application/email/index.ts`, futuro `src/server/application/email/templates/**`.
Riscos/observacoes: espalhar envio diretamente em route handlers vai repetir validacao, logging e fallback; manter o service pequeno e orientado a casos de uso reais.
Nota multi-tenant/idempotencia: metodos de e-mail ligados a negocio devem receber dados explicitos de tenant/restaurante quando houver contexto de dominio.

- [x] 04. Centralizar templates transacionais e politica de conteudo
Definicao de pronto: templates HTML/text separados do service, com variaveis minimas por caso de uso, CTA principal e fallback texto puro; layout base compartilhado definido para os e-mails transacionais.
Arquivos/paths envolvidos: futuro `src/server/application/email/templates/base.ts`, futuro `src/server/application/email/templates/passwordReset.ts`, futuro `src/server/application/email/templates/emailConfirmation.ts`, futuro `src/server/application/email/templates/welcome.ts`.
Riscos/observacoes: template inline dentro de rota dificulta manutencao; nao misturar copy de onboarding com copy de seguranca; links devem ser absolutos e auditaveis.
Nota multi-tenant/idempotencia: o branding pode ser unico nesta fase; personalizacao por tenant fica fora do escopo inicial.

- [x] 05. Implementar fluxo de `forgot password` com link do Supabase e entrega via Resend
Definicao de pronto: rota server-side prevista em `src/app/api/v1/auth/forgot-password/route.ts`; o fluxo gera link com `supabase.auth.admin.generateLink({ type: "recovery" })`, envia via `EmailService` e retorna sucesso generico mesmo para e-mail inexistente.
Arquivos/paths envolvidos: futuro `src/app/api/v1/auth/forgot-password/route.ts`, `src/server/infra/supabase/adminClient.ts`, futuro `src/server/application/email/emailService.ts`.
Riscos/observacoes: nao enumerar usuarios validos; nao expor `action_link` em logs; falha no envio deve ser logada com contexto tecnico sem vazar detalhes ao usuario final.
Nota multi-tenant/idempotencia: fluxo de recovery e auth-scoped, portanto nao depende de tenant resolvido; a resposta HTTP deve ser sempre segura e neutra.

- [x] 06. Consolidar `email confirmation` usando Supabase Auth como fonte de verdade
Definicao de pronto: TODO da implementacao registra que links de confirmacao devem ser gerados/validados pelo Supabase, enviados via Resend e refletidos em `restaurants.email_verified`; o fluxo paralelo por `verification_code` do dominio `Restaurant` entra em trilha de compatibilidade/remocao.
Arquivos/paths envolvidos: `src/app/auth/confirm/route.ts`, `src/server/application/restaurant/restaurantService.ts`, `src/app/api/v1/cheffia/Restaurant/confirm-email/route.ts`, futuro `src/app/api/v1/auth/resend-confirmation/route.ts`.
Riscos/observacoes: manter dois fluxos permanentes cria divergencia entre auth e dominio; o campo `verification_code` atual nao deve continuar como verdade primaria para links sensiveis.
Nota multi-tenant/idempotencia: a confirmacao vem do auth, mas o espelhamento de `restaurants.email_verified` deve respeitar o restaurante/tenant correto sem atualizar registros de outro tenant.

- [x] 07. Definir politica de espelhamento para `restaurants.email_verified`
Definicao de pronto: comportamento decidido e documentado para quando o estado de auth muda; o dominio `Restaurant` passa a refletir confirmacao de auth no cadastro existente, inclusive nos fluxos em que o usuario conclui o callback antes ou depois do `register restaurant`.
Arquivos/paths envolvidos: `src/server/application/restaurant/restaurantService.ts`, `src/business/auth/actions.ts`, `src/app/auth/callback/route.ts`.
Riscos/observacoes: hoje o cadastro do restaurante pode nascer com `emailVerified` vindo de metadata; isso precisa ser revisado para evitar drift e falso positivo.
Nota multi-tenant/idempotencia: o espelhamento deve localizar o restaurante correto pelo `supabase_user_id` e ser seguro contra reexecucao.

- [x] 08. Integrar `welcome email` ao fim do onboarding minimo
Definicao de pronto: envio previsto somente apos sucesso do `register restaurant`; o e-mail deve conter saudacao, proximo passo util e link para entrada no dashboard/operacao principal.
Arquivos/paths envolvidos: `src/app/api/v1/cheffia/Restaurant/register/route.ts`, `src/server/application/restaurant/restaurantService.ts`, futuro `src/server/application/email/emailService.ts`.
Riscos/observacoes: disparar no `auth.signUp` gera boas-vindas para usuarios que ainda nao concluiram o onboarding; o trigger deve ficar no ponto em que a conta ja tem dados minimos de negocio.
Nota multi-tenant/idempotencia: o cadastro de restaurante ja possui preocupacoes de idempotencia; o envio de boas-vindas nao deve duplicar em retries do mesmo request.

- [x] 09. Adicionar `test mode`, observabilidade e tratamento de erro operacional
Definicao de pronto: `EmailService` previsto com suporte a `EMAIL_TEST_MODE`, redirecionamento para `RESEND_OWNER_EMAIL`, log estruturado e regras claras de quando falha de envio bloqueia ou nao o fluxo principal.
Arquivos/paths envolvidos: futuro `src/server/application/email/emailService.ts`, futuro `src/server/infra/external/email/resendClient.ts`.
Riscos/observacoes: sem modo de teste ha risco de disparo acidental em homologacao; sem criterio de criticidade o app pode falhar indevidamente em fluxos nao criticos.
Nota multi-tenant/idempotencia: logs devem incluir `tenantId`, `restaurantId` e `supabaseUserId` quando houver contexto de negocio.

- [x] 10. Atualizar contratos, documentacao interna e pontos de extensao futura
Definicao de pronto: endpoints novos documentados, referencias do Resend adicionadas ao material tecnico, e extensoes futuras registradas para convites de equipe, cobranca e notificacoes operacionais sem entrar no escopo desta entrega.
Arquivos/paths envolvidos: `src/server/openapi/openapi.json`, `scripts/generate-openapi.ts`, `postman/**`, `insomnia/**`, `migração backend/EMAIL_SERVICE_TODO.md`.
Riscos/observacoes: se a documentacao nao refletir que o app usa Supabase para links e Resend para entrega, a implementacao futura tende a reabrir decisoes ja fechadas.
Nota multi-tenant/idempotencia: documentar claramente quais fluxos sao auth-scoped e quais dependem de tenant/restaurante.

- [ ] 11. Cobrir a feature com testes tecnicos e cenarios de resiliencia
Definicao de pronto: matriz de testes prevista para `forgot password`, `email confirmation`, `welcome email`, modo de teste, falha do provider, retry/idempotencia e sincronizacao de `restaurants.email_verified`.
Arquivos/paths envolvidos: futuros `tests/email/**`, futuro `migração backend/EMAIL_TEST_MATRIX.md`, `src/server/openapi/openapi.json`.
Riscos/observacoes: testar apenas o client Resend nao garante integracao; validar fluxo completo com Supabase e persistencia do restaurante.
Nota multi-tenant/idempotencia: incluir casos de retry no `register restaurant`, confirmacao fora de ordem e garantia de que um tenant nao afeta outro.

---

## Ordem recomendada de execucao incremental
1. Itens 01 a 03 para fundacao tecnica.
2. Item 04 para padronizar templates antes de plugar fluxos.
3. Item 05 para `forgot password`.
4. Itens 06 e 07 para consolidar `email confirmation`.
5. Item 08 para `welcome email`.
6. Item 09 para hardening operacional.
7. Itens 10 e 11 para contratos, docs e testes.

## Criterios de aceite que a implementacao final deve cumprir
1. O app envia e-mails transacionais via `Resend` a partir de modulos server-side unificados.
2. `forgot password` usa link de recovery do `Supabase Auth` e responde de forma segura para usuario existente ou inexistente.
3. `email confirmation` passa a ter `Supabase Auth` como fonte primaria de verdade.
4. `restaurants.email_verified` deixa de divergir do estado de auth.
5. `welcome email` dispara apenas apos onboarding minimo concluido.
6. Modo de teste e logs operacionais ficam disponiveis desde a primeira versao.

## Referencias oficiais obrigatorias desta frente
- Resend + Next.js: `https://resend.com/docs/send-with-nextjs`
- Resend + Bun: `https://resend.com/docs/send-with-bun`
- Dashboard de e-mails: `https://resend.com/docs/dashboard/emails/introduction`
- SDKs oficiais: `https://resend.com/docs/sdks`
- SDK Node oficial: `https://github.com/resend/resend-node`
