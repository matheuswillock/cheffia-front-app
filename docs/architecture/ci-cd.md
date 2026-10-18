# CI/CD e promoção de branches

## Fluxo obrigatório

```text
feature/* ou bugfix/*
          │ PR
          ▼
       develop  ──► preview/staging pela Vercel Git Integration
          │ PR
          ▼
        main    ──► produção pela Vercel Git Integration
                         │
                         └─ migrations pelo GitHub Actions (Prisma → Supabase)
```

Pull requests para `develop` aceitam somente `feature/*` ou `bugfix/*`.
Pull requests para `main` aceitam somente `develop`. O workflow em
`.github/workflows/pipeline.yml` valida esse fluxo; a proteção de branches do
GitHub deve impedir push direto e exigir os checks definidos para cada destino.

Após os gates de qualidade, o job `promote` cria automaticamente um PR quando
não houver outro aberto para a mesma promoção:

- `feature/*` ou `bugfix/*` → `develop`;
- `develop` → `main`.

O job é idempotente: pushes adicionais reutilizam o PR aberto em vez de criar
duplicatas.

## Responsabilidade de cada plataforma

### GitHub Actions

Executa os gates de qualidade e a validação local:

- Prisma validate, typecheck, lint e build;
- suíte backend/CI com `bun run test`;
- testes de componentes com `bun run test:components`;
- smoke E2E com `bun run test:e2e`;
- reset do Supabase local;
- verificação do histórico de migrations e do isolamento por tenant/RLS.

O workflow `.github/workflows/production-migrations.yml` é disparado somente
por push em `main` e executa `prisma migrate deploy` seguido de `supabase db
push`. O workflow não faz o deploy da aplicação; essa responsabilidade
permanece na Vercel Git Integration.

O projeto Supabase de produção do Cheffia é:

- ref: `dcicvvxuzfdidaefwerq`;
- URL: `https://dcicvvxuzfdidaefwerq.supabase.co`;
- migrations remotas no momento da configuração: nenhuma.

### Configuração necessária no GitHub

O código do workflow já está pronto, mas o GitHub não permite versionar a
credencial do banco. Configure manualmente:

1. abra **Settings → Environments** no repositório;
2. crie o environment `production`;
3. adicione nele o secret `DIRECT_URL` com a conexão direta do novo projeto;
4. se o runner não alcançar a conexão direta IPv6, use a conexão **Session
   pooler** do Supabase, em modo sessão, na porta 5432;
5. não use `service_role`, publishable key ou senha em arquivos do repositório.

O valor de `DIRECT_URL` é usado pelo Prisma e pelo Supabase CLI no job
serializado. A senha deve estar percent-encoded na URL quando contiver
caracteres especiais. Depois disso, o merge em `main` aplicará a fundação
Cheffia automaticamente.

### Supabase GitHub Integration

No projeto Supabase:

1. conectar este repositório;
2. definir `supabase/` como working directory;
3. usar a integração para branches/preview se desejado;
4. **deixar desabilitado `Deploy to production` para migrations**, pois a
   produção é orquestrada pelo GitHub Actions;
5. opcionalmente mapear `develop` para um projeto ou branch persistente de staging.

O Supabase continua sendo o dono de `supabase/migrations/`, mas não deve haver
dois executores no mesmo banco. O workflow de produção valida os históricos e
aplica primeiro `prisma/migrations/`, depois `supabase/migrations/`.

O workflow atual valida o banco local em PRs e aplica migrations somente no
projeto de produção em `main`. Se `develop` passar a usar um banco de staging
dedicado, ele deverá receber um job de migration equivalente com o secret desse
ambiente; não reutilize o banco de produção para staging.

### Vercel Git Integration

Configurar o repositório na Vercel para:

- preview/staging a partir de `develop`;
- produção a partir de `main`;
- checks de CI obrigatórios antes do merge.

As variáveis de ambiente ficam nos ambientes da Vercel e não devem ser copiadas
para workflows, migrations ou documentação.

Vercel e o job de migrations reagem ao mesmo push em `main` e não formam uma
transação única. Por isso, migrations devem seguir expand/contract e a aplicação
publicada deve ser compatível com o schema anterior durante a janela de rollout.
Se for necessário bloquear o deploy da aplicação quando uma migration falhar, o
deploy da Vercel deverá ser acionado por um workflow após o job de migrations,
em vez da Git Integration direta para produção.

## Ordem de promoção

1. Criar `feature/<nome>` ou `bugfix/<nome>` a partir de `develop`.
2. Abrir PR para `develop` e aguardar todos os checks.
3. Validar o preview/staging.
4. Abrir PR de `develop` para `main`.
5. Aguardar CI e os checks obrigatórios de branch.
6. Fazer merge em `main`; GitHub Actions aplica Prisma → Supabase e Vercel publica a aplicação.
