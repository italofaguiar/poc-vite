# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto do Projeto

Esta é uma POC do **PilotoDeVendas.IA** - uma aplicação SaaS para automação de vendas via WhatsApp com IA. A POC foca em validar a arquitetura de autenticação: backend Python (FastAPI) + frontend React (Vite) + Postgres.

**Leia sempre**: `docs/1.contexto.md` - contém contexto completo do projeto, tech stack principal, e diretrizes (KISS, MVP em 2 meses).

## Arquitetura

### Decisões Técnicas

**Por que Vite (não NextJS)?**
- App é dashboard interno (sem necessidade de SSR/SEO)
- Equipe tem expertise limitada em Node/TS - Vite é mais simples
- Backend Python já existe como API central
- NextJS adicionaria complexidade desnecessária (BFF, deployment extra, learning curve)

**Por que Session-based com cookies HttpOnly (não JWT)?**
- Mais seguro contra XSS (JWT em localStorage é vulnerável)
- Permite revogação instantânea de sessão (crítico para sistema de vendas)
- Mais simples que infraestrutura JWT completa (refresh tokens, rotação, blacklist)

**Por que backend único Python (sem BFF Node)?**
- FastAPI já existente e robusto
- BFF seria overhead de manutenção/deployment para equipe pequena
- KISS: uma stack, um deploy, um ponto de falha

**Produção (CloudRun):**
- Recomendado: mesmo domínio (`app.pilotodevendas.ia`) servindo frontend estático + API
- FastAPI serve `/` (SPA) + `/api/*` (endpoints) - sem CORS necessário
- Cookies: `SameSite=Lax, Secure=True` (máxima segurança)

### Stack
- **Backend**: Python 3.12, FastAPI (async), SQLAlchemy ORM, Postgres
- **Frontend**: React 18, Vite, TailwindCSS, React Router, Axios
- **Infraestrutura**: Docker Compose (dev), GCP CloudRun + CloudSQL (prod)

### Autenticação
- **Padrão**: Session-based com cookies HttpOnly (não JWT)
- **Fluxo**: Login/Signup → cria sessão → cookie `session_id` (HttpOnly, Secure, SameSite=Lax)
- **Storage**: In-memory dict no backend (`backend/app/auth.py::sessions`) - será Redis em produção
- **Expiração**: 7 dias
- **CORS**: Configurado para `http://localhost:5173` com `allow_credentials=True`

### Estrutura de Diretórios
```
backend/app/
├── routers/       # auth.py, dashboard.py
├── models.py      # SQLAlchemy models (User)
├── schemas.py     # Pydantic schemas
├── database.py    # DB config + get_db()
├── auth.py        # Session management
└── main.py        # FastAPI app + CORS

frontend/src/
├── pages/         # Login.jsx, Signup.jsx, Dashboard.jsx
├── components/    # ProtectedRoute.jsx, Chart.jsx, Table.jsx
└── services/      # api.js (axios config + API calls)
```

## Comandos

### Desenvolvimento
```bash
# Subir ambiente completo
docker compose up --build

# Subir só backend (útil para debug)
docker compose up backend db

# Logs de um serviço específico
docker compose logs -f backend

# Acessar container do backend
docker exec -it poc-vite-backend bash

# Recriar DB (apaga volumes)
docker compose down -v && docker compose up --build
```

### Frontend
```bash
# Dentro do container ou localmente
cd frontend
npm run dev          # Dev server (porta 5173)
npm run build        # Build para produção
npm run preview      # Preview do build
```

### Backend
```bash
# Dentro do container ou localmente
cd backend
uvicorn app.main:app --reload  # Dev server (porta 8000)

# Criar tabelas manualmente (se necessário)
python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(bind=engine)"
```

### Testing
```bash
# Backend
cd backend
pytest  # Quando testes forem criados

# Frontend
cd frontend
npm test  # Quando testes forem criados
```

## Endpoints da API

- `GET /` - Health check
- `POST /api/auth/signup` - Criar conta (retorna cookie)
- `POST /api/auth/login` - Login (retorna cookie)
- `POST /api/auth/logout` - Logout (remove cookie)
- `GET /api/auth/me` - Verificar sessão ativa
- `GET /api/dashboard/data` - Dados do dashboard (protegido)

## Notas Importantes

1. **Senhas**: Sempre usar `bcrypt` via `passlib` - nunca armazenar em plaintext
2. **Sessions**: Implementação atual é in-memory (resetada ao reiniciar backend). Produção usará Redis.
3. **CORS**: Backend aceita requests apenas de `localhost:5173`. Atualizar para produção.
4. **Variáveis de ambiente**: Usar `.env` (não commitado). Ver `.env.example` para referência.
5. **Tasks**: O arquivo `.mini_specs/tasks.md` contém o roadmap da POC dividido em 8 fases.
6. **Prioridade**: KISS (Keep It Simple Stupid) sempre que possível. Ver `docs/1.contexto.md` para diretrizes completas.
