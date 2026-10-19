# CI/CD e promoção de branches

## Fluxo obrigatório

```text
feature/* ou bugfix/*
          │ PR
          ▼
       develop  ──► preview/staging pela Vercel Git Integration
           │ PR
           ▼
        release  ──► release candidate / homologação
           │ PR
           ▼
         main    ──► produção pela Vercel Git Integration
                         │
                          └─ migrations pelo Supabase GitHub Integration
```

Pull requests para `develop` aceitam somente `feature/*` ou `bugfix/*`.
Pull requests para `release` aceitam somente `develop`. Pull requests para
`main` aceitam somente `release`. O workflow em
`.github/workflows/pipeline.yml` valida esse fluxo; a proteção de branches do
GitHub deve impedir push direto e exigir os checks definidos para cada destino.

Após os gates de qualidade, o job `promote` cria automaticamente um PR quando
não houver outro aberto para a mesma promoção:

- `feature/*` ou `bugfix/*` → `develop`;
- `develop` → `release`;
- `release` → `main`.

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

O GitHub Actions não executa migrations de produção. O Supabase GitHub
Integration aplica `supabase/migrations/` quando `main` é atualizado. O
workflow não faz o deploy da aplicação; essa responsabilidade permanece na
Vercel Git Integration.

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
3. manter habilitado `Deploy to production` para migrations em `main`;
4. opcionalmente usar a integração para branches/preview;
5. opcionalmente mapear `develop` e `release` para projetos ou branches persistentes de staging.

O Supabase é o único executor de `supabase/migrations/` em produção. Prisma é
somente ORM/client; não existe histórico Prisma de produção.

O workflow atual valida o banco local em PRs e aplica migrations somente no
projeto de produção em `main`. Se `develop` passar a usar um banco de staging
dedicado, ele deverá receber um job de migration equivalente com o secret desse
ambiente; não reutilize o banco de produção para staging.

### Vercel Git Integration

Configurar o repositório na Vercel para:

- preview/staging a partir de `develop` e `release`;
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
3. Aguardar a promoção automática de `develop` para `release`.
4. Validar o release candidate.
5. Aguardar a promoção automática de `release` para `main`.
6. Fazer merge em `main`; Supabase aplica as migrations e Vercel publica a aplicação.
