# Plano POC - PilotoDeVendas.IA Frontend

## Objetivo

Validar arquitetura frontend usando **Vite + React** com autenticação robusta (email/senha via cookies HTTP-only), integrando com backend Python/FastAPI existente, preparando base para evolução do produto nos próximos 2 meses.

## Decisões Técnicas

### Frontend: Vite (NÃO NextJS)

**Justificativa:**
- App não precisa de SSR/SEO (é dashboard interno)
- Equipe tem expertise limitada em Node/TS - Vite é mais simples
- Backend Python já existe e funcionará como API central
- NextJS adicionaria complexidade desnecessária (BFF, deployment extra, learning curve)
- CloudRun já hospeda FastAPI - adicionar Vite é direto (build estático ou SPA)

### Autenticação: Session ID com Cookies HTTP-only (NÃO JWT puro)

**Justificativa:**
- Cookies HTTP-only são mais seguros contra XSS que JWT em localStorage
- Session ID permite revogação instantânea (crítico para sistema de vendas)
- Python/FastAPI tem boas libs (fastapi-sessions, itsdangerous)
- Mais simples que infraestrutura JWT completa (refresh tokens, rotação, blacklist)
- Para OAuth Google futuro: mesma lógica de session funciona

### Arquitetura: Backend Único Python (SEM BFF Node)

**Justificativa:**
- Backend FastAPI já existe e é robusto
- Adicionar BFF Node seria overhead de manutenção/deployment para 1 dev
- FastAPI serve facilmente tanto API quanto autenticação
- Se precisar BFF no futuro (websockets, server-sent events), avaliamos depois
- KISS: uma stack, um deploy, um ponto de falha

## Estratégia de Implementação

### Stack da POC

```
Frontend (Vite + React)
  ├── Vite 6.x + React 18
  ├── React Router para navegação
  ├── Axios para chamadas API
  ├── Recharts para gráficos dummy
  └── TailwindCSS para UI rápida

Backend (FastAPI)
  ├── FastAPI com endpoints:
  │   ├── POST /api/auth/signup
  │   ├── POST /api/auth/login
  │   ├── POST /api/auth/logout
  │   ├── GET /api/auth/me (verifica sessão)
  │   └── GET /api/dashboard/data (dados dummy)
  ├── Sessions com itsdangerous ou redis-sessions
  ├── Middleware CORS configurado para Vite dev
  └── Bcrypt para hash de senhas

Database (PostgreSQL)
  └── Tabela users (id, email, password_hash, created_at)

Infraestrutura
  └── Docker Compose com 3 serviços:
      ├── frontend (node:20 + vite dev server)
      ├── backend (python:3.12 + uvicorn)
      └── db (postgres:16)
```

### Fluxo de Autenticação

1. **Signup:** Frontend → POST /api/auth/signup → Backend cria user + retorna cookie de sessão
2. **Login:** Frontend → POST /api/auth/login → Backend valida credenciais + retorna cookie de sessão
3. **Proteção de rotas:** Frontend verifica sessão via GET /api/auth/me antes de renderizar dashboard
4. **Logout:** Frontend → POST /api/auth/logout → Backend invalida sessão + limpa cookie

### Estrutura de Pastas

```
poc-vite-claude/
├── backend/
│   ├── app/
│   │   ├── main.py (FastAPI app)
│   │   ├── models.py (SQLAlchemy models)
│   │   ├── schemas.py (Pydantic schemas)
│   │   ├── auth.py (lógica autenticação)
│   │   ├── database.py (conexão DB)
│   │   └── routers/
│   │       ├── auth.py (endpoints auth)
│   │       └── dashboard.py (endpoints dados)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── components/ (charts, tables)
│   │   ├── services/api.js (axios config)
│   │   ├── App.jsx (routes)
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── .env.example (vars ambiente)
```

## Próximos Passos

1. Aprovar este plano
2. Criar `.mini_specs/tasks.md` com tasks detalhadas para implementação
3. Executar tasks e construir POC funcional
4. Validar arquitetura com login real e dashboard

## Riscos & Mitigações

- **CORS em dev:** Configurar proxy Vite ou headers CORS específicos no FastAPI
- **Segurança cookies:** SameSite=Lax, Secure=True em produção, domain correto
- **Postgres em dev:** Docker Compose resolve, em prod usar CloudSQL existente
