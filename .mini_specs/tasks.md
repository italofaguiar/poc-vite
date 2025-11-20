# Tasks: CI/CD com GitHub Actions para Cloud Run

**CRÍTICO**: Siga o seguinte ciclo para cada fase:
> implemente uma fase → testa "manual" → commita → atualiza tasks.md

**Obs**: Inclusive, se necessário, pode fazer testes em passos intermediários dentro da própria fase.

---

## Fase 1: Configuração de Permissionamento GCP (Workload Identity Federation)

**Objetivo**: Permitir que GitHub Actions faça deploy no Cloud Run sem usar service account keys (abordagem mais segura).

**Responsável**: Agente Terraform (você vai passar essas orientações para ele)

### Orientações para o Agente Terraform

O GitHub Actions precisa se autenticar no GCP para fazer build e deploy. A abordagem recomendada é **Workload Identity Federation** (não usa chaves JSON, mais seguro).

**O que precisa ser provisionado via Terraform:**

1. **Workload Identity Pool**:
   ```hcl
   resource "google_iam_workload_identity_pool" "github_actions" {
     workload_identity_pool_id = "github-actions-pool"
     display_name              = "GitHub Actions Pool"
     description               = "Workload Identity Pool for GitHub Actions"
   }
   ```

2. **Workload Identity Provider** (GitHub):
   ```hcl
   resource "google_iam_workload_identity_pool_provider" "github" {
     workload_identity_pool_id          = google_iam_workload_identity_pool.github_actions.workload_identity_pool_id
     workload_identity_pool_provider_id = "github-provider"
     display_name                       = "GitHub Provider"

     attribute_mapping = {
       "google.subject"       = "assertion.sub"
       "attribute.actor"      = "assertion.actor"
       "attribute.repository" = "assertion.repository"
     }

     oidc {
       issuer_uri = "https://token.actions.githubusercontent.com"
     }
   }
   ```

3. **Service Account** para GitHub Actions:
   ```hcl
   resource "google_service_account" "github_actions" {
     account_id   = "github-actions-deployer"
     display_name = "GitHub Actions Deployer"
     description  = "Service Account used by GitHub Actions to deploy to Cloud Run"
   }
   ```

4. **Permissões necessárias** (IAM Roles):
   ```hcl
   # Cloud Run Admin (deploy services)
   resource "google_project_iam_member" "github_actions_cloudrun" {
     project = var.project_id
     role    = "roles/run.admin"
     member  = "serviceAccount:${google_service_account.github_actions.email}"
   }

   # Artifact Registry Writer (push images)
   resource "google_project_iam_member" "github_actions_artifact_registry" {
     project = var.project_id
     role    = "roles/artifactregistry.writer"
     member  = "serviceAccount:${google_service_account.github_actions.email}"
   }

   # Cloud Build Editor (submit builds)
   resource "google_project_iam_member" "github_actions_cloudbuild" {
     project = var.project_id
     role    = "roles/cloudbuild.builds.editor"
     member  = "serviceAccount:${google_service_account.github_actions.email}"
   }

   # Service Account User (impersonate service account)
   resource "google_project_iam_member" "github_actions_sa_user" {
     project = var.project_id
     role    = "roles/iam.serviceAccountUser"
     member  = "serviceAccount:${google_service_account.github_actions.email}"
   }
   ```

5. **Binding do Workload Identity** (permite GitHub assumir o SA):
   ```hcl
   resource "google_service_account_iam_member" "github_actions_workload_identity" {
     service_account_id = google_service_account.github_actions.name
     role               = "roles/iam.workloadIdentityUser"
     member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_actions.name}/attribute.repository/SEU_USUARIO_GITHUB/poc-vite"
   }
   ```

   **IMPORTANTE**: Substitua `SEU_USUARIO_GITHUB` pelo nome correto do usuário/org no GitHub (ex: `italobusi` se o repo for `italobusi/poc-vite`).

6. **Outputs necessários** (para configurar GitHub Actions):
   ```hcl
   output "github_actions_workload_identity_provider" {
     description = "Workload Identity Provider name for GitHub Actions"
     value       = google_iam_workload_identity_pool_provider.github.name
   }

   output "github_actions_service_account_email" {
     description = "Service Account email for GitHub Actions"
     value       = google_service_account.github_actions.email
   }
   ```

**Validação**: Após aplicar o Terraform, retorne os outputs para uso nas próximas fases.

### Checklist

- [ ] Criar Workload Identity Pool no GCP
- [ ] Criar Workload Identity Provider (GitHub OIDC)
- [ ] Criar Service Account `github-actions-deployer`
- [ ] Conceder roles necessários ao SA (Cloud Run Admin, Artifact Registry Writer, Cloud Build Editor, SA User)
- [ ] Configurar binding Workload Identity (GitHub → SA)
- [ ] Executar `terraform apply` e validar outputs
- [ ] Documentar outputs (Workload Identity Provider name + SA email) para uso no GitHub Actions

---

## Fase 2: Criação do Workflow GitHub Actions

**Objetivo**: Criar pipeline CI/CD que roda lint, testes, build e deploy no Cloud Run.

### Checklist

- [ ] Criar arquivo `.github/workflows/ci-cd.yml`
- [ ] Configurar trigger: apenas branch `main` (push)
- [ ] **Job 1 - Lint**:
  - [ ] Instalar UV (backend)
  - [ ] Instalar Node (frontend)
  - [ ] Rodar `make lint` (backend + frontend)
  - [ ] Falhar workflow se lint falhar
- [ ] **Job 2 - Test** (roda em paralelo com Lint):
  - [ ] Instalar UV (backend)
  - [ ] Instalar Node (frontend)
  - [ ] Rodar `make test` (testes unitários backend + frontend)
  - [ ] Falhar workflow se testes falharem
- [ ] **Job 3 - Build and Deploy** (depende de Lint + Test):
  - [ ] Autenticar no GCP via Workload Identity
  - [ ] Submit build via Cloud Build (`gcloud builds submit --config cloudbuild.yaml`)
  - [ ] Aguardar build completar
  - [ ] Atualizar Cloud Run para puxar nova imagem
  - [ ] Validar deploy (curl no /health)
- [ ] Testar workflow localmente com `act` (opcional)
- [ ] Commit do arquivo workflow

**Arquivo exemplo**: `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: pilotodevendas-prod
  REGION: us-east1
  SERVICE_NAME: poc-vite
  IMAGE: us-east1-docker.pkg.dev/pilotodevendas-prod/containers/poc-vite:latest

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install UV
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Run lint (backend + frontend)
        run: |
          export PATH="$HOME/.local/bin:$PATH"
          make lint

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install UV
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Run tests (backend + frontend)
        run: |
          export PATH="$HOME/.local/bin:$PATH"
          make test

  build-and-deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    needs: [lint, test]
    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT_EMAIL }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Build image via Cloud Build
        run: |
          gcloud builds submit \
            --config cloudbuild.yaml \
            --project=${{ env.PROJECT_ID }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run services update ${{ env.SERVICE_NAME }} \
            --project=${{ env.PROJECT_ID }} \
            --region=${{ env.REGION }} \
            --image=${{ env.IMAGE }}

      - name: Verify deployment
        run: |
          SERVICE_URL=$(gcloud run services describe ${{ env.SERVICE_NAME }} \
            --project=${{ env.PROJECT_ID }} \
            --region=${{ env.REGION }} \
            --format="value(status.url)")

          echo "Service URL: $SERVICE_URL"

          # Wait for deployment to stabilize
          sleep 10

          # Test health endpoint
          curl -f "$SERVICE_URL/health" || exit 1

          echo "✅ Deployment successful!"
```

---

## Fase 3: Configuração de Secrets no GitHub

**Objetivo**: Adicionar secrets necessários para o workflow no repositório GitHub.

### Checklist

- [ ] Acessar GitHub: `Settings` → `Secrets and variables` → `Actions`
- [ ] Adicionar secret `GCP_WORKLOAD_IDENTITY_PROVIDER`:
  - Valor: output do Terraform `github_actions_workload_identity_provider`
  - Formato: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider`
- [ ] Adicionar secret `GCP_SERVICE_ACCOUNT_EMAIL`:
  - Valor: output do Terraform `github_actions_service_account_email`
  - Formato: `github-actions-deployer@pilotodevendas-prod.iam.gserviceaccount.com`
- [ ] Validar que secrets foram salvos corretamente

**Como obter os valores**:
```bash
# Após terraform apply na Fase 1
cd ~/projects/pvia-infra/terraform
terraform output github_actions_workload_identity_provider
terraform output github_actions_service_account_email
```

---

## Fase 4: Teste Manual do Pipeline

**Objetivo**: Validar que o CI/CD funciona end-to-end.

### Checklist

- [ ] Fazer uma alteração trivial no código (ex: adicionar comentário em README)
- [ ] Criar commit e push para branch `main`
- [ ] Acessar GitHub Actions e observar workflow executando
- [ ] **Validar Job Lint**:
  - [ ] Backend lint passou (ruff + mypy)
  - [ ] Frontend lint passou (eslint)
- [ ] **Validar Job Test**:
  - [ ] Testes backend passaram
  - [ ] Testes frontend passaram
- [ ] **Validar Job Build and Deploy**:
  - [ ] Autenticação GCP funcionou
  - [ ] Cloud Build completou com sucesso
  - [ ] Cloud Run foi atualizado
  - [ ] Health check passou
- [ ] Acessar URL do Cloud Run e validar manualmente:
  - [ ] Frontend carrega
  - [ ] Login funciona
  - [ ] Dashboard carrega
- [ ] Verificar logs do Cloud Run se houver problemas

**Troubleshooting comum**:
- **Lint falha**: Rodar `make lint` localmente e corrigir erros antes de commitar
- **Testes falham**: Rodar `make test` localmente e corrigir
- **Auth GCP falha**: Verificar secrets do GitHub e outputs do Terraform
- **Build falha**: Verificar logs do Cloud Build no GCP Console
- **Deploy falha**: Verificar permissões do SA no Cloud Run

---

## Fase 5: Ajustes e Documentação

**Objetivo**: Documentar processo, adicionar melhorias e garantir que time pode usar CI/CD.

### Checklist

- [ ] **Documentar CI/CD** (criar `docs/ci-cd.md`):
  - [ ] Como funciona o workflow
  - [ ] Quando o deploy acontece (push na main)
  - [ ] Como debugar falhas no workflow
  - [ ] Como adicionar novos jobs/steps
- [ ] **Atualizar README.md**:
  - [ ] Adicionar badge do GitHub Actions (opcional)
  - [ ] Mencionar que deploy é automático na main
  - [ ] Reforçar importância de `make lint` e `make test` antes de push
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

4. **Build via Cloud Build**: Usa `cloudbuild.yaml` existente, que já está otimizado (multi-stage build).

5. **Deploy apenas na main**: Branches de feature não fazem deploy automaticamente. Isso evita deploys acidentais.

6. **Secrets gerenciados pelo Terraform**: DATABASE_URL, SECRET_KEY, OAuth credentials já estão no Secret Manager e são injetados automaticamente pelo Cloud Run.

7. **Branch Protection**: Se disponível no plano grátis do GitHub, configure para exigir que lint+test passem antes do merge. Caso contrário, o workflow já serve como gate de qualidade (vai falhar no deploy se testes falharem).

8. **Paralelização**: Lint e Test rodam em paralelo para economizar tempo. Deploy só roda após ambos passarem.

9. **Health check**: Workflow valida que deploy foi bem-sucedido fazendo curl no `/health` endpoint.

10. **Iteração**: Após primeira implementação, você pode adicionar melhorias (cache, notificações, preview deploys) conforme necessário.

---

## Roadmap Futuro (Fora do escopo desta POC)

- Ambientes de staging/homologação
- Deploy preview em Pull Requests
- Testes E2E no CI (Playwright)
- Rollback automático se métricas de erro dispararem
- Deploy canary (gradual rollout)
- Integração com ferramentas de observabilidade (Datadog, Sentry)
