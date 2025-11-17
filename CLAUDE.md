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

### Gerenciamento de Dependências

**Backend**: Usa **UV** (gerenciador moderno de pacotes Python) com `pyproject.toml`.

- Dependências definidas em `backend/pyproject.toml`
- UV é instalado automaticamente no Docker
- Mais rápido que pip tradicional
- Setup local: `./scripts/setup-backend.sh` (instala UV + dependências)

**Comandos UV úteis**:
```bash
# Instalar/atualizar dependências (modo nativo)
uv sync

# Adicionar nova dependência
uv add <pacote>

# Remover dependência
uv remove <pacote>

# Rodar comandos no ambiente virtual do UV
uv run uvicorn app.main:app --reload
```

### Autenticação
- **Padrão**: Session-based com cookies HttpOnly (não JWT)
- **Fluxo**: Login/Signup → cria sessão → cookie `session_id` (HttpOnly, Secure, SameSite=Lax)
- **Storage**: In-memory dict no backend (`backend/app/auth.py::sessions`) - será Redis em produção
- **Expiração**: 7 dias
- **Proxy**: Vite redireciona `/api/*` para backend (`http://backend:8000`) - navegador vê mesmo domínio

### Dark Mode e Sistema de Cores

**Tema padrão**: Dark mode (verde/preto inspirado no pvia-lp)

**Paleta de cores**:
- **Dark Mode (default)**:
  - Background: `#0a0a0a` (preto principal), `#111111` (preto secundário)
  - Primary: `#00ff88` (verde brilhante), `#00cc6a` (verde escuro)
  - Text: `#ffffff` (branco), `#b3b3b3` (cinza claro)
  - Borders: `rgba(0, 255, 136, 0.1)` (verde translúcido)

- **Light Mode**:
  - Background: `#ffffff` (branco), `#f5f5f5` (cinza claro)
  - Primary: `#00cc6a` (verde escuro), `#00a855` (verde mais escuro)
  - Text: `#0a0a0a` (preto), `#666666` (cinza escuro)
  - Borders: `rgba(0, 204, 106, 0.2)` (verde translúcido)

**Implementação**:
- `ThemeContext` (`frontend/src/contexts/ThemeContext.tsx`): gerencia estado do tema
- Persistência em `localStorage` (key: `theme`)
- Detecta preferência do sistema na primeira visita
- Toggle disponível **apenas no Dashboard** (não em páginas de autenticação)

**Classes Tailwind úteis**:
```tsx
// Backgrounds
className="bg-app-primary dark:bg-dark-app-primary"
className="bg-app-secondary dark:bg-dark-app-secondary"

// Textos
className="text-app-primary dark:text-dark-app-primary"
className="text-app-secondary dark:text-dark-app-secondary"

// Borders
className="border-app-primary dark:border-dark-app-primary"

// Botão primário com gradiente (classe custom em index.css)
className="btn-primary"  // Gradiente verde + glow effect no hover
```

**Efeitos visuais**:
- Gradiente linear nos botões primários: `linear-gradient(135deg, #00ff88, #00cc6a)`
- Glow effect no hover: `box-shadow: 0 0 20px rgba(0, 255, 136, 0.4)`
- Transições suaves: `transition-colors duration-300`
- Recharts adapta cores ao tema (via `useTheme` hook)

### Branding e Identidade Visual

**Logo**: 🤖 + "PilotoDeVendas.IA" (emoji provisório, futura substituição por logo real)

**Tipografia**: Inter (Google Fonts)
- Pesos: 400 (regular), 600 (semibold), 700 (bold)
- Headlines: Inter 600-700
- Body text: Inter 400

**Componentes de Branding**:

**1. Logo Component** (`frontend/src/components/Logo.tsx`):
```tsx
<Logo variant="full" size="lg" />        // Hero sections: 🤖 PilotoDeVendas.IA
<Logo variant="compact" size="sm" />     // Dashboard header: 🤖 PilotoDeVendas
```
- Props: `variant` (full/compact), `size` (sm/md/lg), `linkTo` (opcional), `className`
- Adapta-se ao tema (verde-neon no texto)

**2. AnimatedBackground** (`frontend/src/components/AnimatedBackground.tsx`):
```tsx
<AnimatedBackground />
```
- Pulso radial verde-neon animado (4s loop)
- Três camadas com delays diferentes para profundidade
- Usado nas hero sections de Login/Signup

**3. HeroSection** (`frontend/src/components/HeroSection.tsx`):
```tsx
<HeroSection
  title="Seu Vendedor de IA 24/7 no WhatsApp"
  subtitle="Qualifique leads, conduza vendas e aumente sua conversão com inteligência artificial"
  showAnimation={true}
/>
```
- Props: `title`, `subtitle` (opcional), `showAnimation` (default: true)
- Combina Logo + AnimatedBackground + Copy
- Responsivo (stacks em mobile)

**Layout das Páginas**:
- **Login/Signup**: Duas colunas (hero section à esquerda, form à direita)
  - Desktop: 50/50 split
  - Mobile: Stacked (hero compacto no topo)
- **Dashboard**: Logo discreto no header (alinhado à esquerda)
  - Layout: `[Logo] | Dashboard | user@email | [ThemeToggle] [Sair]`

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
    ├── components/    # ProtectedRoute, Chart, Table, ErrorMessage,
    │                  # Logo, HeroSection, AnimatedBackground, ThemeToggle
    ├── contexts/      # ThemeContext.tsx
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
# Setup inicial (apenas primeira vez ou para novos devs)
./scripts/setup-backend.sh

# Dentro do container ou localmente
cd backend
uv run uvicorn app.main:app --reload  # Dev server (porta 8000)

# Instalar/atualizar dependências com UV
uv sync

# Adicionar nova dependência
uv add <pacote>

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

### Ambiente de Desenvolvimento vs Produção

**Docker Compose**: Usar para desenvolvimento com hot-reload e testes exploratórios (manual + Playwright).

**Ferramentas de dev** (lint, testes unitários): Rodar diretamente com UV/npm, não via Docker.

```bash
# Desenvolvimento diário
docker compose up --build        # Hot-reload, testes manuais/Playwright

# Linting e testes unitários
cd backend && uv run ruff check app/ && uv run mypy app/
cd frontend && npm run lint && npm test
```

**Containers de produção**: Enxutos, sem dev tools (ruff, mypy, ESLint).

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
7. **Linting antes de commit**: **SEMPRE** executar linting localmente antes de commitar código:
   - **Frontend**: `cd frontend && npm run lint` (deve passar com 0 erros/warnings)
   - **Backend**: `cd backend && uv run ruff check app/ && uv run mypy app/` (ambos devem passar)
   - Isso garante qualidade de código e evita problemas de build em produção
8. **Git**: **NUNCA** use `git commit --amend`. Sempre crie novos commits. Isso preserva o histórico completo e evita problemas de sincronização.
