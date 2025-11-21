# Deploy no GCP Cloud Run

**Infraestrutura completa gerenciada via Terraform** (projeto `pvia-infra`).

Este guia cobre apenas o **deploy de código** (build + atualização da imagem).

---

## ⚠️ IMPORTANTE - SQLite Temporário

**STATUS ATUAL:**
- 🔄 App usa **SQLite em `/tmp/poc.db`** (configurado via Terraform)
- ⚠️ **Dados perdidos em restart do container**
- 📋 Cloud SQL será conectado posteriormente (via Terraform)

---

## Deploy (3 passos)

### 1. Build da Imagem

```bash
# Build e push via Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Imagem gerada: us-east1-docker.pkg.dev/pilotodevendas-prod/containers/poc-vite:latest
```

### 2. Atualizar Cloud Run

```bash
# Força Cloud Run a puxar nova imagem :latest
gcloud run services update poc-vite \
  --project=pilotodevendas-prod \
  --region=us-east1 \
  --image=us-east1-docker.pkg.dev/pilotodevendas-prod/containers/poc-vite:latest
```

**Nota:** CPU, memória, secrets, env vars são gerenciados pelo Terraform (não alterar aqui).

### 3. Verificar

```bash
# Obter URL
SERVICE_URL=$(gcloud run services describe poc-vite \
  --project=pilotodevendas-prod \
  --region=us-east1 \
  --format="value(status.url)")

echo "🚀 App: $SERVICE_URL"

# Testar
curl $SERVICE_URL/health
# Deve retornar: {"status":"healthy",...}

# Abrir no navegador
echo "Acesse: $SERVICE_URL"
```

---

## Logs

```bash
gcloud run services logs tail poc-vite \
  --project=pilotodevendas-prod \
  --region=us-east1
```

---

## Secrets OAuth

✅ **Secrets já configurados** via Secret Manager (Google OAuth credentials + SECRET_KEY).

```bash
# Verificar secrets
gcloud secrets versions list google-client-id --project=pilotodevendas-prod
gcloud secrets versions list google-client-secret --project=pilotodevendas-prod
gcloud secrets versions list secret-key --project=pilotodevendas-prod
```

---

## Troubleshooting

**502 Bad Gateway:**
```bash
# Ver logs
gcloud run services logs tail poc-vite --project=pilotodevendas-prod --region=us-east1

# Verificar se container inicia na porta 8080
```

**OAuth não funciona:**
```bash
# Verificar se secrets foram atualizados
gcloud secrets versions list google-client-id --project=pilotodevendas-prod

# Verificar redirect URI no Google Console:
# https://SEU_DOMINIO/api/auth/google/callback
```

**Testar build local:**
```bash
# Script completo que testa build + health check + endpoints
./scripts/test-production-build.sh
```

---

## Infraestrutura (Terraform)

**Gerenciado em `pvia-infra/terraform/`:**
- ✅ Cloud Run service `poc-vite` (CPU: 1 vCPU, Mem: 512Mi)
- ✅ Secrets (google-client-id, google-client-secret, secret-key)
- ✅ IAM permissions (service account com acesso aos secrets)
- ✅ Artifact Registry `containers`
- ✅ Env vars (ENVIRONMENT, DATABASE_URL)

**Para alterar infraestrutura** (CPU, memória, env vars, etc):
1. Editar `pvia-infra/terraform/main.tf`
2. `terraform plan` + `terraform apply`
3. **NÃO** usar `gcloud run deploy` com flags de infra

---

## Referências

- [cloudbuild.yaml](../cloudbuild.yaml) - Build configuration
- [Dockerfile.prod](../Dockerfile.prod) - Multi-stage build
- [backend/app/database.py](../backend/app/database.py) - SQLite fallback
- Terraform: `/home/italo/projects/pvia-infra/terraform/main.tf`
