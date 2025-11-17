# Roadmap: Deployment & Arquitetura de Domínios

**Decisão**: Usar **mesmo domínio** (`app.pilotodevendas.ia`) para frontend + backend até necessidade comprovada por métricas.

---

## 📊 Contexto do Negócio

**Meses 0-2 (MVP/POC):**
- ~5 clientes
- Time interno testando
- Todos no Brasil

**Meses 2-6 (Crescimento Inicial):**
- 5-50 clientes
- Alguns clientes nos EUA
- Vendedores usando interface de atendimento (tempo real)
- Estimativa: ~100-500 sessões/dia

---

## 🎯 Decisão Arquitetural: Mesmo Domínio

### Por quê?

**Volume baixo:**
- 50 clientes = carga baixíssima para CloudRun
- 1 instância aguenta milhares de requests/segundo
- Muito longe de precisar escalar horizontalmente

**Segurança:**
- Cookies `SameSite=Lax` (máxima segurança)
- Sem necessidade de `SameSite=None` (vulnerável a CSRF)
- Zero configuração CORS (menos bugs)

**Simplicidade (KISS):**
- Um deploy, uma URL, uma configuração SSL
- Time pequeno foca em features, não DevOps
- Menos pontos de falha

**Tempo Real (WebSockets):**
- FastAPI tem WebSockets nativos
- Funciona perfeitamente no mesmo domínio
- Interface de atendimento para vendedores não precisa CDN separado

**Latência:**
- Brasil → Brasil: ~50ms
- Brasil → EUA: ~200-300ms (aceitável para dashboard)
- Atendimento final (WhatsApp) fica no Brasil

---

## 📋 Roadmap por Fase

### **Fase 1: MVP/POC (Meses 0-2)**

**Arquitetura:**
```
app.pilotodevendas.ia (CloudRun)
├── / → Frontend (SPA estático servido por FastAPI)
├── /api/* → Backend (endpoints FastAPI)
└── /ws/* → WebSockets (atendimento em tempo real)
```

**Configuração:**
- FastAPI serve arquivos estáticos do frontend
- **Zero CORS**
- Cookies: `SameSite=Lax, Secure=True, HttpOnly`
- Region: `southamerica-east1` (São Paulo)
- Instâncias: 0-3 (scale-to-zero quando não usar)
- Recursos: 1 CPU, 512Mi RAM

**Custo estimado:** $20-40/mês

**Tarefas:**
- [ ] Criar Dockerfile multi-stage (build frontend + backend)
- [ ] Configurar FastAPI para servir SPA
- [ ] Deploy inicial CloudRun
- [ ] Configurar domínio `app.pilotodevendas.ia`
- [ ] SSL automático via CloudRun
- [ ] Testar cookies em produção

---

### **Fase 2: Crescimento Inicial (Meses 2-6)**

**Arquitetura:**
```
✅ Mantém mesmo domínio
```

**Ações:**
1. **Monitoramento** (adicionar métricas ao dashboard):
   - Latência média de requests (p50, p95, p99)
   - Uso de CPU/memória CloudRun
   - Tempo de resposta para usuários EUA vs Brasil
   - Erros de timeout/conexão
   - Sessões WebSocket simultâneas

2. **Otimizações se necessário:**
   - Aumentar `max_instances` para 5-10
   - Implementar caching (Redis para sessões)
   - Otimizar queries do banco (índices)
   - Adicionar Cloud CDN para assets estáticos (se latência EUA > 500ms)

**Custo estimado:** $50-100/mês

**Tarefas:**
- [ ] Implementar métricas de latência no dashboard
- [ ] Configurar alertas no GCP (CPU > 70%, latência > 500ms)
- [ ] Migrar sessões de in-memory para Redis (Cloud Memorystore)
- [ ] Revisar queries N+1 no SQLAlchemy
- [ ] Testes de carga (simular 100 usuários simultâneos)

---

### **Fase 3: Re-avaliação (Mês 6+)**

**Gatilhos para considerar separação de domínios:**

| Métrica | Valor Atual (Fase 2) | Gatilho para Separar |
|---------|---------------------|----------------------|
| Usuários simultâneos | <50 | >200 |
| Latência EUA (medida) | ~300ms | >500ms + reclamações |
| CloudRun CPU | <30% | >70% sustentado |
| Requests/segundo | <100 | >1000 |
| Reclamações de lentidão | 0 | >5% dos usuários |
| Custo CloudRun | <$100/mês | >$500/mês (escala ineficiente) |

**Se NÃO atingir esses gatilhos → continua mesmo domínio!**

**Alternativa antes de separar domínios:**
1. **Adicionar Cloud CDN** (ainda mesmo domínio):
   - CDN cacheia assets estáticos (JS, CSS, imagens)
   - API continua direto no CloudRun
   - Custo extra: ~$10-20/mês
   - Latência EUA cai para <100ms (assets)
   - **Escala até 1000+ clientes sem separar**

**Tarefas:**
- [ ] Revisar métricas dos últimos 6 meses
- [ ] Decisão: manter, adicionar CDN, ou separar domínios
- [ ] Se separar: planejar migração (CORS, cookies `SameSite=None`, etc)

---

## 🏗️ Implementação Técnica (Fase 1)

### **1. Estrutura FastAPI servindo SPA**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
import os

app = FastAPI()

# Routers da API (ANTES de servir arquivos estáticos)
app.include_router(auth_router, prefix="/api/auth")
app.include_router(dashboard_router, prefix="/api/dashboard")
app.include_router(websocket_router, prefix="/ws")

# Servir arquivos estáticos do frontend
if os.path.exists("/app/frontend/dist"):
    # Assets (JS, CSS, imagens) com cache
    app.mount("/assets", StaticFiles(directory="/app/frontend/dist/assets"), name="assets")

    # Fallback para SPA (todas as rotas não capturadas → index.html)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = f"/app/frontend/dist/{full_path}"
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse("/app/frontend/dist/index.html")
```

### **2. Dockerfile multi-stage**

```dockerfile
# Build frontend
FROM node:20 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend
FROM python:3.12-slim
WORKDIR /app

# Instalar dependências Python
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código backend
COPY backend/ ./backend/

# Copiar build do frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Porta CloudRun (padrão 8080)
EXPOSE 8080

# Comando de inicialização
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### **3. Configuração de Cookies (Produção)**

```python
# backend/app/routers/auth.py
response.set_cookie(
    key="session_id",
    value=session_id,
    httponly=True,           # Não acessível via JavaScript
    secure=True,             # Apenas HTTPS
    samesite="lax",          # Mesmo domínio (segurança máxima)
    max_age=60*60*24*7,      # 7 dias
    domain="app.pilotodevendas.ia"  # Explícito
)
```

**Sem CORS necessário!** ✨

### **4. CloudRun YAML (opcional)**

```yaml
# cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: piloto-vendas-app
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"  # Scale-to-zero
        autoscaling.knative.dev/maxScale: "3"
    spec:
      containers:
      - image: gcr.io/PROJECT_ID/piloto-vendas:latest
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: "1"
            memory: 512Mi
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-url
              key: url
```

---

## 🔍 Monitoramento (Fase 2)

### **Métricas a adicionar no Dashboard:**

1. **Latência por região:**
   ```python
   # Middleware para capturar latência + país
   @app.middleware("http")
   async def log_latency(request: Request, call_next):
       start = time.time()
       response = await call_next(request)
       latency = time.time() - start
       country = request.headers.get("CloudFront-Viewer-Country", "BR")
       # Salvar métrica no DB ou Cloud Monitoring
       return response
   ```

2. **CloudRun CPU/Memória:**
   - Usar GCP Monitoring (built-in)
   - Alertas se CPU > 70% por 5 minutos

3. **Sessões WebSocket:**
   - Contador de conexões ativas
   - Tempo médio de conexão

### **Alertas a configurar:**

- Latência p99 > 1000ms
- CPU CloudRun > 70% (5 min)
- Memória > 80%
- Taxa de erro > 1%

---

## 💰 Estimativa de Custos

| Fase | Usuários | Instâncias | CloudRun | CloudSQL | Redis | Total/mês |
|------|----------|------------|----------|----------|-------|-----------|
| MVP (0-2m) | 5 | 0-1 | $20 | $10 | - | **$30** |
| Crescimento (2-6m) | 50 | 0-3 | $50 | $20 | $30 | **$100** |
| Escala (6m+) | 200 | 1-5 | $150 | $50 | $30 | **$230** |
| Com CDN | 500 | 1-10 | $300 | $100 | $50 | **$450** |

**Separar domínios não reduz custos** (pode até aumentar pela complexidade).

---

## 🚀 Cenário Otimista: Crescimento Rápido

**Se chegar em 200 clientes no mês 4:**

**Solução sem separar domínios:**
1. Adicionar **Cloud CDN** na frente do CloudRun
   - CDN cacheia assets estáticos
   - API continua direto no CloudRun
   - **Ainda mesmo domínio!**
   - Latência EUA: <100ms (assets), ~200ms (API)

2. Escalar CloudRun horizontalmente (automático)
   - Aumentar `max_instances` para 10-20

**Escala até 1000+ clientes sem separar domínios.**

---

## 📚 Referências

- **KISS**: Keep It Simple, Stupid! (ver `docs/1.contexto.md`)
- **FastAPI Static Files**: https://fastapi.tiangolo.com/tutorial/static-files/
- **CloudRun Pricing**: https://cloud.google.com/run/pricing
- **SameSite Cookies**: https://web.dev/samesite-cookies-explained/

---

## 🎯 TL;DR

| Decisão | Recomendação | Quando Re-avaliar |
|---------|--------------|-------------------|
| **Arquitetura** | Mesmo domínio | Só se métricas provarem necessidade |
| **CORS** | Não usar | Só se separar domínios (improvável) |
| **CDN** | Não precisa agora | Se latência EUA > 500ms no mês 6+ |
| **WebSockets** | Mesmo domínio | N/A |
| **Escala** | 1 instância (0-3 max) | 3-5 quando >100 clientes, 5-10 quando >200 |
| **Custo** | ~$30-100/mês | Revisar se >$500/mês |

**Conclusão:** Manter mesmo domínio até métricas comprovarem necessidade de separação (improvável nos próximos 12 meses).
