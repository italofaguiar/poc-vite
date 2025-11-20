# Deploy no GCP Cloud Run

Guia objetivo para deploy da aplicação no Google Cloud Platform.

---

## ⚠️ IMPORTANTE - SQLite Temporário

**STATUS ATUAL (MVP inicial):**
- 🔄 **Deploy usa SQLite em memória** (sem Cloud SQL)
- ✅ Bom para validação inicial e testes
- ⚠️ **Dados são perdidos quando container reinicia**
- 📋 Cloud SQL será configurado posteriormente via Terraform

**Para deploy inicial:** Pule a seção Cloud SQL.

---

## Pré-requisitos

1. **Conta GCP** com billing habilitado
2. **gcloud CLI** instalado e autenticado (`gcloud auth login`)
3. **Permissões** necessárias: Cloud Run Admin, Artifact Registry Admin

## Passo 1: Configurar GCP

```bash
# Definir variáveis
export PROJECT_ID="seu-projeto-gcp"
export REGION="us-central1"  # ou região mais próxima

# Set project
gcloud config set project $PROJECT_ID

# Habilitar APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

## Passo 2: Criar Artifact Registry

```bash
gcloud artifacts repositories create pilotodevendas \
  --repository-format=docker \
  --location=$REGION \
  --description="PilotoDeVendas.IA container images"
```

## Passo 3: Build e Push da Imagem

```bash
# Cloud Build usa o cloudbuild.yaml existente
gcloud builds submit --config cloudbuild.yaml
```

**Nota:** O `cloudbuild.yaml` referencia `Dockerfile.prod` (build multi-stage otimizado).

## Passo 4: Configurar Secrets

```bash
# Gerar SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Criar secrets
echo -n "SUA_SECRET_KEY_GERADA_ACIMA" | \
  gcloud secrets create pilotodevendas-secret-key --data-file=-

# OAuth Google (se usar)
echo -n "SEU_GOOGLE_CLIENT_ID" | \
  gcloud secrets create pilotodevendas-google-client-id --data-file=-

echo -n "SEU_GOOGLE_CLIENT_SECRET" | \
  gcloud secrets create pilotodevendas-google-client-secret --data-file=-

# Dar permissão ao Cloud Run
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for SECRET in pilotodevendas-secret-key pilotodevendas-google-client-id pilotodevendas-google-client-secret; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
done
```

## Passo 5: Deploy no Cloud Run

**Deploy simples (sem Cloud SQL):**

```bash
gcloud run deploy pilotodevendas \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/pilotodevendas/app:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "ENVIRONMENT=production" \
  --set-secrets "SECRET_KEY=pilotodevendas-secret-key:latest,GOOGLE_CLIENT_ID=pilotodevendas-google-client-id:latest,GOOGLE_CLIENT_SECRET=pilotodevendas-google-client-secret:latest"
```

**Nota:** Sem Cloud SQL configurado, a aplicação usará SQLite em memória automaticamente.

## Passo 6: Verificar Deploy

```bash
# Obter URL
SERVICE_URL=$(gcloud run services describe pilotodevendas \
  --region $REGION \
  --format="value(status.url)")

echo "Aplicação: $SERVICE_URL"

# Testar
curl $SERVICE_URL/health
# Deve retornar: {"status":"healthy",...}

curl -I $SERVICE_URL/
# Deve retornar: HTTP/2 200 (SPA carregado)
```

Acesse `$SERVICE_URL` no navegador para testar a aplicação.

## Configurar Domínio Customizado (Opcional)

```bash
gcloud run domain-mappings create \
  --service pilotodevendas \
  --domain app.pilotodevendas.ia \
  --region $REGION

# Configurar DNS conforme instruções exibidas
```

## Monitoramento

```bash
# Logs em tempo real
gcloud run services logs tail pilotodevendas --region $REGION

# Métricas
# Acesse: https://console.cloud.google.com/run
```

---

## Configuração Cloud SQL (Futura - via Terraform)

<details>
<summary>📋 Passo a passo quando Cloud SQL estiver pronto</summary>

### Atualizar deploy com Cloud SQL:

```bash
# Obter connection name do Terraform
CLOUD_SQL_CONNECTION_NAME="PROJECT_ID:REGION:INSTANCE_NAME"

# Criar secret com DATABASE_URL
echo -n "postgresql://USER:PASS@/DB?host=/cloudsql/$CLOUD_SQL_CONNECTION_NAME" | \
  gcloud secrets create pilotodevendas-db-url --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding pilotodevendas-db-url \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

# Atualizar deploy
gcloud run services update pilotodevendas \
  --region $REGION \
  --add-cloudsql-instances $CLOUD_SQL_CONNECTION_NAME \
  --update-secrets "DATABASE_URL=pilotodevendas-db-url:latest"
```

### Criar tabelas (primeira vez):

```bash
# Conectar via Cloud SQL Proxy
cloud_sql_proxy -instances=$CLOUD_SQL_CONNECTION_NAME=tcp:5432 &

# Aplicação cria tabelas automaticamente no startup (via SQLAlchemy)
# Ou criar manualmente via psql se preferir
```

</details>

---

## Custos Estimados (MVP)

| Recurso | Tier | Custo/mês |
|---------|------|-----------|
| Cloud Run | 512Mi RAM, 1 vCPU, ~100k req | ~$5-10 |
| Artifact Registry | < 0.5GB | ~$0.10 |
| **Total (sem SQL)** | | **~$5-10** |

**Adicionar quando configurar Cloud SQL:**
- Cloud SQL db-f1-micro: ~$7-15/mês

## Referências

- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Dockerfile.prod](../Dockerfile.prod)
- [backend/app/database.py](../backend/app/database.py) - Fallback SQLite
