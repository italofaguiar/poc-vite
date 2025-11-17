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

**Desenvolvimento e Produção (Mesmo Domínio):**
- **Dev**: Vite proxy redireciona `/api/*` para backend - sem CORS necessário
- **Prod**: Mesmo domínio (`app.pilotodevendas.ia`) servindo frontend estático + API
- FastAPI serve `/` (SPA) + `/api/*` (endpoints) - arquitetura consistente dev/prod
- Cookies: `SameSite=Lax, Secure=True` (máxima segurança em prod)

### Stack
- **Backend**: Python 3.12, FastAPI (async), SQLAlchemy ORM, Postgres
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Router, Axios, Zod
- **Infraestrutura**: Docker Compose (dev), GCP CloudRun + CloudSQL (prod)

### Autenticação
- **Padrão**: Session-based com cookies HttpOnly (não JWT)
- **Fluxo**: Login/Signup → cria sessão → cookie `session_id` (HttpOnly, Secure, SameSite=Lax)
- **Storage**: In-memory dict no backend (`backend/app/auth.py::sessions`) - será Redis em produção
- **Expiração**: 7 dias
- **Proxy**: Vite redireciona `/api/*` para backend (`http://backend:8000`) - navegador vê mesmo domínio

### Estrutura de Diretórios
```
backend/app/
├── routers/       # auth.py, dashboard.py
├── models.py      # SQLAlchemy models (User)
├── schemas.py     # Pydantic schemas
├── database.py    # DB config + get_db()
├── auth.py        # Session management
└── main.py        # FastAPI app

frontend/
├── vite.config.ts # Vite config + proxy (/api -> backend:8000)
└── src/
    ├── pages/         # Login.tsx, Signup.tsx, Dashboard.tsx
    ├── components/    # ProtectedRoute.tsx, Chart.tsx, Table.tsx, ErrorMessage.tsx
    ├── services/      # api.ts (axios config + API calls)
    ├── types/         # index.ts (tipos centralizados + type guards)
    └── schemas/       # auth.ts, dashboard.ts (validação Zod)
```

### TypeScript e Validação

**TypeScript**: Todo frontend está em TypeScript (.tsx/.ts) com tipagem completa.

**Princípios de tipagem** (pragmático, não obsessivo):
- ✅ Tipar props de componentes
- ✅ Tipar respostas da API
- ✅ Tipar estado e hooks quando tipo não é inferido
- ❌ Evitar tipos complexos/genéricos avançados desnecessários

**Validação com Zod**:
- Formulários validados antes de submit (email, senha)
- Respostas da API validadas no client (garantir shape correto)
- Schemas em `frontend/src/schemas/` (auth.ts, dashboard.ts)

**Tipos centralizados** (`frontend/src/types/index.ts`):
- `AsyncState<T>` - Estados de loading padronizados (idle, loading, success, error)
- `ApiError` - Tipagem de erros FastAPI
- `isApiError()` - Type guard para erros de API
- `getErrorMessage()` - Helper para extrair mensagens de erro
- Todos os tipos de API re-exportados (DashboardData, User, etc.)

**Error Handling**:
- Interceptor Axios em `api.ts` loga erros em dev e redireciona 401 para login
- Error handling tipado com type guards em todos os componentes
- Componente `ErrorMessage` reutilizável para exibir erros de forma consistente

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
npm run build        # Build para produção (verifica tipos TypeScript)
npm run preview      # Preview do build
npm run lint         # Executar ESLint (deve passar com 0 erros/warnings)
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

**Frontend** (Vitest + React Testing Library):
```bash
cd frontend
npm test              # Modo watch (dev)
npm run test:run      # Executar testes uma vez (CI)
npm run test:ui       # Interface visual do Vitest

# Dentro do container
docker compose exec frontend npm test
```

**Cobertura de testes atual**:
- ✅ Schemas Zod (auth.test.ts, dashboard.test.ts) - 31 testes
- ✅ Type guards e helpers (types/index.test.ts) - 16 testes
- ✅ Componentes críticos (ProtectedRoute, Login, Signup) - 23 testes
- **Total**: 70 testes passando

**Backend**:
```bash
cd backend
pytest  # Quando testes forem criados
```

## Princípios de Desenvolvimento

### KISS: Keep It Simple, Stupid!
**Princípio fundamental**: Sempre escolher a solução mais simples que funcione. Evitar over-engineering.

- Preferir soluções diretas a arquiteturas complexas
- Não adicionar abstrações/patterns sem necessidade clara
- Código legível > código "elegante"
- MVP funcional > solução "perfeita"

## MCPs Disponíveis

O Playwright MCP está configurado no arquivo `.mcp.json` (versionado no Git).

**Configuração**: O arquivo `.mcp.json` na raiz do projeto é compartilhado com toda a equipe. Não é necessário configurar MCPs localmente.

### Playwright MCP

O Playwright fornece automação completa de navegador com acesso a:
- 🧪 Testes E2E e automação
- 📊 Network requests e respostas
- 🍪 Cookies e session storage
- 🐛 Console logs e erros
- 📸 Screenshots e snapshots
- ⚡ Performance básica

**Observação importante**: Sempre iniciar testes com a janela maximizada usando `browser_resize` (width: 1920, height: 1080) logo após navegação. Isso garante que elementos responsivos sejam renderizados corretamente e evita problemas de layout em testes E2E.

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
3. **Proxy**: Dev usa proxy do Vite (`/api` → `backend:8000`). Prod usa mesmo domínio. Sem CORS necessário.
4. **Variáveis de ambiente**: Usar `.env` (não commitado). Ver `.env.example` para referência.
5. **Tasks**: O arquivo `.mini_specs/tasks.md` contém o roadmap da POC dividido em 5 fases.
6. **Prioridade**: KISS (Keep It Simple Stupid) sempre que possível. Ver `docs/1.contexto.md` para diretrizes completas.
7. **Linting antes de commit**: **SEMPRE** executar linting antes de commitar código:
   - **Frontend**: `docker compose exec frontend npm run lint` (deve passar com 0 erros/warnings)
   - **Backend**: `docker compose exec backend sh /app/lint.sh` (ruff + mypy devem passar)
   - Isso garante qualidade de código e evita problemas de build em produção
