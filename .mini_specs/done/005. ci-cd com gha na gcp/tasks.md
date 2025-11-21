# Tasks: CI/CD com GitHub Actions para Cloud Run

**CRÍTICO**: Siga o seguinte ciclo para cada fase:
> implemente uma fase → testa "manual" → commita → atualiza tasks.md

**Obs**: Inclusive, se necessário, pode fazer testes em passos intermediários dentro da própria fase.

---

## Fase 1: Configuração de Permissionamento GCP (Workload Identity Federation)

**Objetivo**: Permitir que GitHub Actions faça deploy no Cloud Run sem usar service account keys (abordagem mais segura).

**Responsável**: Agente Terraform

**✅ FASE CONCLUÍDA**

### Recursos Provisionados

**Terraform**: Módulo `github_actions` criado em `/home/italo/projects/pvia-infra/terraform/modules/github_actions/`

**Recursos GCP criados e validados**:
1. ✅ **Workload Identity Pool**: `github-actions-pool` (ACTIVE)
2. ✅ **Workload Identity Provider**: `github-provider` (ACTIVE, OIDC GitHub)
3. ✅ **Service Account**: `github-actions-deployer@pilotodevendas-prod.iam.gserviceaccount.com`
4. ✅ **IAM Roles**:
   - `roles/run.admin` (deploy Cloud Run)
   - `roles/artifactregistry.writer` (push imagens Docker)
   - `roles/iam.serviceAccountUser` (impersonate SA)
5. ✅ **Workload Identity Binding**: Restrição `assertion.repository == 'italofaguiar/poc-vite'`

### Outputs para GitHub Secrets

**Referência completa**: `/home/italo/projects/pvia-infra/.mini_specs/github_actions_outputs.txt`

**Valores para configurar GitHub Actions**:
```bash
# Secret 1: GCP_WORKLOAD_IDENTITY_PROVIDER
projects/229191889267/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider

# Secret 2: GCP_SERVICE_ACCOUNT_EMAIL
github-actions-deployer@pilotodevendas-prod.iam.gserviceaccount.com
```

**Como obter via Terraform**:
```bash
cd ~/projects/pvia-infra/terraform
terraform output github_actions_workload_identity_provider
terraform output github_actions_service_account_email
```

---

## Fase 2: Criação do Workflow GitHub Actions

**Objetivo**: Criar pipeline CI/CD que roda lint, testes, build e deploy no Cloud Run.

**✅ FASE CONCLUÍDA**

### Workflow Criado

**Arquivo**: `.github/workflows/ci-cd.yml`

**Configuração**:
- ✅ Trigger: push na branch `main`
- ✅ **Job 1 - Lint** (paralelo):
  - Python 3.12 + UV
  - Node 18 + npm cache
  - Executa `make lint` (backend ruff/mypy + frontend ESLint)
- ✅ **Job 2 - Test** (paralelo):
  - Python 3.12 + UV
  - Node 18 + npm cache
  - Executa `make test` (testes unitários backend + frontend)
- ✅ **Job 3 - Build and Deploy** (sequencial, após lint+test):
  - Autentica via Workload Identity (usa secrets configurados na Fase 3)
  - Build Docker: `Dockerfile.prod`
  - Push para Artifact Registry: `us-east1-docker.pkg.dev/pilotodevendas-prod/containers/poc-vite:latest`
  - Deploy no Cloud Run: `poc-vite` (região `us-east1`)
  - Validação: health check via curl

**Validação**: ✅ YAML syntax válido

**Próximo passo**: Configurar GitHub Secrets (Fase 3) para permitir autenticação do workflow no GCP

---

## Fase 3: Configuração de Secrets no GitHub

**Objetivo**: Adicionar secrets necessários para o workflow no repositório GitHub.

**✅ FASE CONCLUÍDA**

### Secrets Configurados

**Método**: GitHub CLI (`gh secret set`)

**Secrets criados**:
- ✅ `GCP_WORKLOAD_IDENTITY_PROVIDER`: `projects/229191889267/.../github-provider`
- ✅ `GCP_SERVICE_ACCOUNT_EMAIL`: `github-actions-deployer@pilotodevendas-prod.iam.gserviceaccount.com`

**Validação**:
```bash
$ gh secret list
GCP_SERVICE_ACCOUNT_EMAIL
GCP_WORKLOAD_IDENTITY_PROVIDER
```

**Referência**: Valores da Fase 1 (provisionados via Terraform)

---

## Fase 4: Teste Manual do Pipeline

**Objetivo**: Validar que o CI/CD funciona end-to-end.

**✅ FASE CONCLUÍDA**

### Validações Realizadas

- ✅ PR #2 criado com todas as mudanças
- ✅ CI rodou no PR (Lint + Test)
- ✅ Merge realizado na `main`
- ✅ **Workflow completo executado**:
  - ✅ Lint: Backend (ruff + mypy) + Frontend (ESLint)
  - ✅ Test: Backend + Frontend (com Postgres 16)
  - ✅ Build & Deploy: Docker + Artifact Registry + Cloud Run
  - ✅ Health check: `{"status":"healthy","mode":"production"}`
- ✅ **App validado em produção**:
  - URL: https://poc-vite-uasawowwvq-ue.a.run.app
  - Frontend carrega ✅
  - Login funciona ✅
  - Dashboard funciona ✅

**Troubleshooting comum**:
- **Lint falha**: Rodar `make lint` localmente e corrigir erros antes de commitar
- **Testes falham**: Rodar `make test` localmente e corrigir
- **Auth GCP falha**: Verificar secrets do GitHub e outputs do Terraform
- **Build falha**: Verificar logs do GitHub Actions, testar build local com `docker build -f Dockerfile.prod -t test .`
- **Push falha**: Verificar permissões do SA no Artifact Registry (role `artifactregistry.writer`)
- **Deploy falha**: Verificar permissões do SA no Cloud Run (role `run.admin`)

---

## Fase 5: Ajustes e Documentação

**Objetivo**: Documentar processo, adicionar melhorias e garantir que time pode usar CI/CD.

**✅ FASE CONCLUÍDA (tarefas de documentação)**

### Documentação Criada

- ✅ **`docs/ci-cd.md`**: Como funciona o workflow, quando deploy acontece, debug, adicionar jobs
- ✅ **README.md atualizado**:
  - ✅ Badge do GitHub Actions no topo
  - ✅ Aviso sobre deploy automático na main
  - ✅ Importância de `make lint` e `make test` antes de commit

### Melhorias Opcionais (não implementadas)
- [ ] **Branch Protection Rules no GitHub** (se disponível no plano grátis):
  - [ ] Require status checks before merging (lint + test devem passar)
  - [ ] Require branches to be up to date
- [ ] **Melhorias opcionais**:
  - [ ] Adicionar notificações de deploy (Slack, Discord, email)
  - [ ] Cache de dependências do UV/npm para builds mais rápidos
  - [ ] Deploy preview em PRs (staging environment)
  - [ ] Rollback automático se health check falhar

**Validação final**: Fazer um commit final de documentação e observar workflow rodar com sucesso.

---

## Observações Importantes

1. **Linting como gate de qualidade**: O workflow falha se lint não passar. Isso força boas práticas e código limpo.

2. **Testes bloqueiam deploy**: Deploy só acontece se lint + test passarem. Isso evita bugs em produção.

3. **Workload Identity > Service Account Keys**: Mais seguro, sem chaves JSON commitadas ou vazadas.

4. **Docker build direto no GitHub Actions**: Simplicidade (KISS), custo-efetivo (2000min grátis/mês), padrão da indústria. Usa `Dockerfile.prod` existente (multi-stage build).

5. **Deploy apenas na main**: Branches de feature não fazem deploy automaticamente. Isso evita deploys acidentais.

6. **Secrets gerenciados pelo Terraform**: DATABASE_URL, SECRET_KEY, OAuth credentials já estão no Secret Manager e são injetados automaticamente pelo Cloud Run.

7. **Branch Protection**: Se disponível no plano grátis do GitHub, configure para exigir que lint+test passem antes do merge. Caso contrário, o workflow já serve como gate de qualidade (vai falhar no deploy se testes falharem).

8. **Paralelização**: Lint e Test rodam em paralelo para economizar tempo. Deploy só roda após ambos passarem.

9. **Health check**: Workflow valida que deploy foi bem-sucedido fazendo curl no `/health` endpoint.

10. **Iteração**: Após primeira implementação, você pode adicionar melhorias (cache, notificações, preview deploys) conforme necessário.

11. **Por que Docker direto e não Cloud Build?**: Decisão baseada em KISS - menos serviços, mais portável, custo-efetivo (2000min grátis/mês suficiente para ~400 builds), padrão da indústria. Cloud Build seria útil apenas com volumes muito altos (>500 builds/mês).

---

## Roadmap Futuro (Fora do escopo desta POC)

- Ambientes de staging/homologação
- Deploy preview em Pull Requests
- Testes E2E no CI (Playwright)
- Rollback automático se métricas de erro dispararem
- Deploy canary (gradual rollout)
- Integração com ferramentas de observabilidade (Datadog, Sentry)
