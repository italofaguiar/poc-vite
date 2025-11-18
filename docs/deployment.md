# Deploy no GCP Cloud Run

Este documento descreve o processo de deploy da aplicação **PilotoDeVendas.IA** no Google Cloud Platform usando Cloud Run e Cloud SQL.

## Arquitetura de Produção

```
┌─────────────────────────────────────┐
│      Cloud Run (Container)          │
│  ┌────────────────────────────────┐ │
│  │  FastAPI Backend (porta 8080)  │ │
│  │  • Serve SPA (/) + API (/api)  │ │
│  │  • StaticFiles do frontend     │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
              │
              │ (Private IP)
              ▼
┌─────────────────────────────────────┐
│        Cloud SQL (Postgres)         │
│  • Instância gerenciada             │
│  • Backups automáticos              │
│  • Alta disponibilidade (opcional)  │
└─────────────────────────────────────┘
```

## Pré-requisitos

1. **Conta GCP** com billing habilitado
2. **gcloud CLI** instalado e autenticado
3. **Docker** para build local (opcional - pode usar Cloud Build)
4. **Permissões** necessárias:
   - Cloud Run Admin
   - Cloud SQL Admin
   - Service Account User
   - Storage Admin (para Artifact Registry)

## Passo 1: Configurar Cloud SQL

### 1.1. Criar instância Cloud SQL

```bash
# Definir variáveis
PROJECT_ID="seu-projeto-gcp"
REGION="us-central1"  # Escolha a região mais próxima
INSTANCE_NAME="pilotodevendas-db"

# Criar instância Postgres
gcloud sql instances create $INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \  # Tier barato para MVP - ajustar em produção
  --region=$REGION \
  --root-password="SENHA_SEGURA_AQUI"  # Trocar por senha forte!
```

### 1.2. Criar database e usuário

```bash
# Criar database
gcloud sql databases create pilotodevendas --instance=$INSTANCE_NAME

# Criar usuário da aplicação
gcloud sql users create appuser \
  --instance=$INSTANCE_NAME \
  --password="SENHA_APP_AQUI"  # Trocar por senha forte!
```

### 1.3. Obter connection name

```bash
# Salvar connection name (formato: PROJECT_ID:REGION:INSTANCE_NAME)
gcloud sql instances describe $INSTANCE_NAME --format="value(connectionName)"
# Exemplo de output: meu-projeto:us-central1:pilotodevendas-db
```

## Arquitetura do Dockerfile de Produção

O `Dockerfile.prod` usa **3 stages** para otimizar tamanho e segurança:

```
┌─────────────────────────────────────┐
│   Stage 1: frontend-builder         │
│   • Node 20 Alpine                  │
│   • npm ci + npm run build          │
│   • Output: /frontend/dist/         │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Stage 2: python-builder           │
│   • Python 3.12 slim                │
│   • UV + gcc (build tools)          │
│   • uv sync --no-dev                │
│   • Output: .venv/ (compilado)      │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Stage 3: production (FINAL)       │
│   • Python 3.12 slim                │
│   • Copia .venv/ do stage 2         │
│   • Copia dist/ do stage 1          │
│   • SEM UV, SEM gcc, SEM curl       │
│   • Imagem final: ~200-300MB        │
└─────────────────────────────────────┘
```

**Benefícios:**
- ✅ Imagem final enxuta (sem ferramentas de build)
- ✅ Menor superfície de ataque (segurança)
- ✅ Startup mais rápido no Cloud Run
- ✅ Menor custo de storage no Artifact Registry

## Passo 2: Build e Push da Imagem

### 2.1. Habilitar APIs necessárias

```bash
gcloud services enable \
  run.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com
```

### 2.2. Criar repositório no Artifact Registry

```bash
gcloud artifacts repositories create pilotodevendas \
  --repository-format=docker \
  --location=$REGION \
  --description="PilotoDeVendas.IA container images"
```

### 2.3. Build e push da imagem

**Opção A: Build local + push**

```bash
# Configurar Docker para autenticar no Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build da imagem
docker build -f Dockerfile.prod -t pilotodevendas:latest .

# Tag para Artifact Registry
docker tag pilotodevendas:latest \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/pilotodevendas/app:latest

# Push
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/pilotodevendas/app:latest
```

**Opção B: Cloud Build (recomendado)**

```bash
gcloud builds submit \
  --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/pilotodevendas/app:latest \
  --file Dockerfile.prod
```

## Passo 3: Deploy no Cloud Run

### 3.1. Criar arquivo .env para produção

Crie `.env.prod` (NÃO commitar no Git!):

```env
# Database
DATABASE_URL=postgresql://appuser:SENHA_APP_AQUI@/pilotodevendas?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME

# Security
SECRET_KEY=gere-uma-chave-secreta-aleatoria-aqui-com-32-chars-minimo

# Environment
ENVIRONMENT=production
```

**Gerar SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3.2. Deploy do serviço

```bash
# Obter connection name (do passo 1.3)
CLOUD_SQL_CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME --format="value(connectionName)")

# Deploy
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
  --set-secrets "DATABASE_URL=pilotodevendas-db-url:latest,SECRET_KEY=pilotodevendas-secret-key:latest" \
  --add-cloudsql-instances $CLOUD_SQL_CONNECTION_NAME
```

**Nota:** As variáveis sensíveis devem ser armazenadas no **Secret Manager** (veja seção 3.3).

### 3.3. Configurar secrets (recomendado)

```bash
# Criar secrets no Secret Manager
echo -n "postgresql://appuser:SENHA@/pilotodevendas?host=/cloudsql/$CLOUD_SQL_CONNECTION_NAME" | \
  gcloud secrets create pilotodevendas-db-url --data-file=-

echo -n "SUA_SECRET_KEY_AQUI" | \
  gcloud secrets create pilotodevendas-secret-key --data-file=-

# Dar permissão ao Cloud Run para acessar secrets
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding pilotodevendas-db-url \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding pilotodevendas-secret-key \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

## Passo 4: Configurar Domínio Customizado (Opcional)

```bash
# Mapear domínio customizado
gcloud run domain-mappings create \
  --service pilotodevendas \
  --domain app.pilotodevendas.ia \
  --region $REGION

# Seguir instruções para configurar DNS (Cloud DNS ou seu provedor)
```

## Passo 5: Criar Tabelas do Database

```bash
# Conectar ao Cloud SQL via proxy local
cloud_sql_proxy -instances=$CLOUD_SQL_CONNECTION_NAME=tcp:5432 &

# Rodar migrations (FastAPI cria automaticamente via SQLAlchemy)
# Ou conectar via psql e criar manualmente:
PGPASSWORD="SENHA_APP" psql -h 127.0.0.1 -U appuser -d pilotodevendas -c "
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"
```

**Alternativa:** Trigger da aplicação ao iniciar (já implementado em `backend/app/database.py`).

## Passo 6: Verificar Deploy

```bash
# Obter URL do serviço
SERVICE_URL=$(gcloud run services describe pilotodevendas \
  --region $REGION \
  --format="value(status.url)")

echo "Aplicação disponível em: $SERVICE_URL"

# Testar health check (endpoint dedicado)
curl $SERVICE_URL/health
# Deve retornar: {"status":"healthy","service":"PilotoDeVendas.IA API","version":"0.1.0","mode":"production"}

# Testar SPA (root retorna index.html)
curl -I $SERVICE_URL/
# Deve retornar: HTTP/2 200 com Content-Type: text/html

# Testar API endpoint
curl $SERVICE_URL/api/auth/me
# Deve retornar: HTTP 401 (não autenticado)

# Testar login
curl -X POST $SERVICE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123"}'
```

## Monitoramento e Logs

### Ver logs em tempo real
```bash
gcloud run services logs tail pilotodevendas --region $REGION
```

### Ver métricas
- Acesse: https://console.cloud.google.com/run
- Selecione o serviço `pilotodevendas`
- Aba "Metrics" para CPU, memória, requests, latência

### Configurar alertas
```bash
# Exemplo: alerta de erro rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate - PilotoDeVendas" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=60s
```

## Custos Estimados (MVP)

| Recurso | Tier | Custo Mensal (estimado) |
|---------|------|-------------------------|
| Cloud Run | 512Mi RAM, 1 vCPU, ~100k requests | ~$5-10 |
| Cloud SQL | db-f1-micro (0.6GB RAM) | ~$7-15 |
| Artifact Registry | < 0.5GB | ~$0.10 |
| **Total** | | **~$12-25/mês** |

**Notas:**
- Cloud Run tem free tier de 2M requests/mês
- Custos podem variar com tráfego
- Considerar Cloud SQL HA ($$$) apenas em produção

## CI/CD (Próximos Passos)

Para automatizar deploys via GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}

      - name: Build and Deploy
        run: |
          gcloud builds submit --config cloudbuild.yaml
```

## Troubleshooting

### Erro: "Cloud SQL connection failed"
- Verificar `--add-cloudsql-instances` no deploy
- Verificar DATABASE_URL (formato correto: `?host=/cloudsql/...`)
- Verificar permissões do Service Account

### Erro: "502 Bad Gateway"
- Verificar logs: `gcloud run services logs tail`
- Verificar se aplicação inicia na porta 8080
- Verificar health check

### Erro: "Permission denied"
- Verificar IAM roles do Service Account
- Verificar Secret Manager permissions
- Verificar Cloud SQL IAM

## Referências

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL for Postgres](https://cloud.google.com/sql/docs/postgres)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [Cloud Run + Cloud SQL](https://cloud.google.com/sql/docs/postgres/connect-run)
