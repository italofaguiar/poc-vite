# Deploy no GCP Cloud Run

Guia direto para deploy da aplicação. **Infraestrutura (Artifact Registry, APIs, etc) já configurada via Terraform.**

---

## ⚠️ IMPORTANTE - SQLite Temporário

**STATUS ATUAL:**
- 🔄 Deploy usa **SQLite em memória** (sem Cloud SQL)
- ✅ Útil para validação inicial
- ⚠️ **Dados perdidos em restart do container**
- 📋 Cloud SQL será conectado posteriormente (via Terraform)

---

## Passo 1: Build da Imagem

```bash
# Build e push via Cloud Build (usa cloudbuild.yaml)
gcloud builds submit --config cloudbuild.yaml

# Imagem gerada: us-east1-docker.pkg.dev/pilotodevendas-prod/containers/poc-vite:latest
```

**Nota:** `cloudbuild.yaml` já está configurado com projeto e região corretos.

---

## Passo 2: Configurar Secrets

```bash
# 1. Gerar SECRET_KEY
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# 2. Criar secrets no Secret Manager
echo -n "$SECRET_KEY" | \
  gcloud secrets create poc-vite-secret-key \
  --project=pilotodevendas-prod \
  --replication-policy="automatic" \
  --data-file=-

# 3. OAuth Google (obter do Google Cloud Console)
# https://console.cloud.google.com/apis/credentials
echo -n "SEU_GOOGLE_CLIENT_ID_AQUI" | \
  gcloud secrets create poc-vite-google-client-id \
  --project=pilotodevendas-prod \
  --replication-policy="automatic" \
  --data-file=-

echo -n "SEU_GOOGLE_CLIENT_SECRET_AQUI" | \
  gcloud secrets create poc-vite-google-client-secret \
  --project=pilotodevendas-prod \
  --replication-policy="automatic" \
  --data-file=-

# 4. Dar permissão ao Cloud Run (compute service account)
PROJECT_NUMBER=$(gcloud projects describe pilotodevendas-prod --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for SECRET in poc-vite-secret-key poc-vite-google-client-id poc-vite-google-client-secret; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --project=pilotodevendas-prod \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
done
```

**Nota:** Google OAuth credentials devem ser configurados em https://console.cloud.google.com/apis/credentials com redirect URI: `https://SEU_DOMINIO/api/auth/google/callback`

---

## Passo 3: Deploy no Cloud Run

```bash
gcloud run deploy poc-vite \
  --project=pilotodevendas-prod \
  --region=us-east1 \
  --image=us-east1-docker.pkg.dev/pilotodevendas-prod/containers/poc-vite:latest \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60s \
  --set-env-vars="ENVIRONMENT=production" \
  --set-secrets="SECRET_KEY=poc-vite-secret-key:latest,GOOGLE_CLIENT_ID=poc-vite-google-client-id:latest,GOOGLE_CLIENT_SECRET=poc-vite-google-client-secret:latest"
```

**Nota:** Sem Cloud SQL configurado, aplicação usa SQLite automaticamente (`backend/app/database.py`).

---

## Passo 4: Verificar Deploy

```bash
# Obter URL do serviço
SERVICE_URL=$(gcloud run services describe poc-vite \
  --project=pilotodevendas-prod \
  --region=us-east1 \
  --format="value(status.url)")

echo "🚀 Aplicação: $SERVICE_URL"

# Testar health check
curl $SERVICE_URL/health
# Deve retornar: {"status":"healthy",...}

# Testar SPA
curl -I $SERVICE_URL/
# Deve retornar: HTTP/2 200

# Testar no navegador
echo "Acesse: $SERVICE_URL"
```

---

## Logs e Monitoramento

```bash
# Logs em tempo real
gcloud run services logs tail poc-vite \
  --project=pilotodevendas-prod \
  --region=us-east1

# Ou via console
# https://console.cloud.google.com/run?project=pilotodevendas-prod
```

---

## Atualizar Deploy (redeploy)

```bash
# 1. Build nova imagem
gcloud builds submit --config cloudbuild.yaml

# 2. Atualizar Cloud Run (força pull da nova imagem)
gcloud run services update poc-vite \
  --project=pilotodevendas-prod \
  --region=us-east1 \
  --image=us-east1-docker.pkg.dev/pilotodevendas-prod/containers/poc-vite:latest
```

---

## Conectar Cloud SQL (Futuro)

<details>
<summary>📋 Quando Cloud SQL estiver pronto via Terraform</summary>

```bash
# 1. Obter connection name do Terraform output
CLOUD_SQL_CONNECTION_NAME="pilotodevendas-prod:us-east1:NOME_INSTANCIA"

# 2. Criar secret com DATABASE_URL
echo -n "postgresql://USER:PASS@/DB?host=/cloudsql/$CLOUD_SQL_CONNECTION_NAME" | \
  gcloud secrets create poc-vite-db-url \
  --project=pilotodevendas-prod \
  --replication-policy="automatic" \
  --data-file=-

# 3. Grant access
gcloud secrets add-iam-policy-binding poc-vite-db-url \
  --project=pilotodevendas-prod \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

# 4. Atualizar Cloud Run
gcloud run services update poc-vite \
  --project=pilotodevendas-prod \
  --region=us-east1 \
  --add-cloudsql-instances=$CLOUD_SQL_CONNECTION_NAME \
  --update-secrets="DATABASE_URL=poc-vite-db-url:latest"
```

Aplicação detectará `DATABASE_URL` e usará PostgreSQL automaticamente.

</details>

---

## Configurar Domínio Customizado

```bash
# Mapear domínio (configurado via Terraform ou console)
gcloud run domain-mappings create \
  --service=poc-vite \
  --domain=app.pilotodevendas.ia \
  --region=us-east1 \
  --project=pilotodevendas-prod

# Configurar DNS conforme instruções exibidas
```

---

## Troubleshooting

**502 Bad Gateway:**
```bash
# Verificar logs
gcloud run services logs tail poc-vite --project=pilotodevendas-prod --region=us-east1

# Verificar se porta 8080 está correta (CMD no Dockerfile.prod)
```

**Secrets não encontrados:**
```bash
# Listar secrets
gcloud secrets list --project=pilotodevendas-prod

# Verificar IAM do service account
gcloud secrets get-iam-policy poc-vite-secret-key --project=pilotodevendas-prod
```

**Aplicação não inicia:**
```bash
# Testar build local
docker build -f Dockerfile.prod -t test .
docker run -p 8080:8080 -e ENVIRONMENT=production test

# Acessar: http://localhost:8080/health
```

---

## Referências

- [cloudbuild.yaml](../cloudbuild.yaml) - Build configuration
- [Dockerfile.prod](../Dockerfile.prod) - Production multi-stage build
- [backend/app/database.py](../backend/app/database.py) - SQLite fallback
