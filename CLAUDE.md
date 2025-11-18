# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto do Projeto

Esta é uma POC do **PilotoDeVendas.IA** - uma aplicação SaaS para automação de vendas via WhatsApp com IA. A POC foca em validar a arquitetura de autenticação: backend Python (FastAPI) + frontend React (Vite) + Postgres.

**Leia sempre**: `docs/poc/1.contexto.md` - contém contexto completo do projeto (documento histórico da análise Vite vs NextJS), tech stack principal, e diretrizes (KISS, MVP em 2 meses).

## Visão do Produto Completo

**PilotoDeVendas.IA** é uma plataforma SaaS de automação de vendas via WhatsApp com IA para pequenos e médios empresários.

### Modos de Operação
- **Modo Piloto**: IA assume a negociação de forma autônoma (qualificação de leads SDR + vendas)
- **Modo Copiloto**: Auxilia vendedores humanos em tempo real com sugestões de respostas

### Capacidades Principais
- 💬 **WhatsApp**: Integração oficial (WABA) e não-oficial (Z-API, Evolution API)
- 🔄 **CRM Sync**: Sincronização em tempo real via webhooks (Make)
- 📚 **RAG**: Consulta base de conhecimento da empresa para embasar respostas
- 🎙️ **Áudio/Voz**: Processa e responde áudio, clona voz de sócios/vendedores
- 📄 **Documentos**: Interpreta imagens, PDF, DOCX
- 📅 **Follow-up**: Régua customizável quando lead não responde
- 🧠 **Aprendizado**: Delega dúvidas para humano e aprende (não repete perguntas)
- 📊 **Analytics**: Dashboards de performance do piloto
- 🔍 **Auditoria**: Classifica atendimentos humanos e extrai insights
- 🔗 **Integrações**: Google Calendar, CRMs, Stripe, centenas de ferramentas

### Stack Backend Existente (MVP em Produção)
- **Python 3.12** + **FastAPI** (async) + **LangChain/LangGraph** (LLM orchestration)
- **SQLAlchemy ORM** + **PostgreSQL** (CloudSQL na GCP)
- **WhatsApp**: Z-API (não-oficial), Evolution API (container), WABA (oficial)
- **CRM Sync**: Webhooks no Make (endpoints configurados como tools do agente)
- **Infra GCP**: CloudRun, CloudSQL, GTasks, Terraform

**Importante**: O backend Python já está em produção e é o **Source of Truth** para:
- LLM, RAG, get/send WhatsApp messages
- Propriedade do banco de dados (Postgres)

## Contexto da Equipe e Constraints

### Equipe
- **Atual**: 1 dev (expertise Python muito alta, Node/TS/React básico)
- **Em 3 meses**: +1 fullstack junior
- **Ferramenta**: Claude Code MAX ilimitado (acelera desenvolvimento, inclusive em techs menos dominadas)

### Timeline e Objetivos
- **Objetivo**: MVP frontend operacional em **2 meses** (clientes podem logar e configurar agentes)
- **Prioridade**: KISS (Keep It Simple Stupid) - entregar rápido, iterar depois
- **Capacitação**: Sem problemas em aprender novas tecnologias, mas custo-benefício e tempo são fatores críticos

### Preferências de Infraestrutura
- **Filosofia**: Soluções versáteis que exigem **menos ops**, mesmo que custem um pouco mais financeiramente
- **Exemplo**: CloudRun (serverless) vs VMs autogerenciadas

### Diretrizes de Desenvolvimento
- **KISS primeiro**: Na dúvida entre simplicidade e boas práticas complexas, tender ao simples (mas consultar em casos críticos)
- **Python first**: Manter stack principal em Python sempre que possível (expertise + código existente)
- **Sem SEO**: App é dashboard interno (não precisa SSR/SEO) - landing page de marketing é separada (NextJS)
- **BFF**: Abertos a inserir BFF em Node/NextJS **se e somente se** trouxer benefícios claros no contexto (até agora não traz)

## Roadmap e Evolução

### Curto Prazo (2 meses) - **Foco atual**
**Frontend da aplicação:**
- ✅ Autenticação (email/senha + OAuth Google) - POC concluída
- ⏳ Configuração de agentes de IA (prompts, tools, régua de follow-up)
- ⏳ Gestão de RAG (upload de arquivos TXT/PDF + integração Google Drive)
- ⏳ Dashboards de performance dos agentes

### Médio Prazo (4 meses)
**Plataforma completa:**
- Gestão de usuários (vendedores, admins, permissões)
- Interface de atendimento (similar ao WhatsApp Web - usa API oficial ou Evolution container)
- Modo Copiloto (análise em tempo real de atendimentos + sugestões de respostas/procedimentos)
- Logs de atendimentos de vendedores humanos
- Assinaturas e pagamentos (Stripe)
- Integrações nativas com CRMs populares (HubSpot, RD Station, etc.) + Google Calendar

## Arquitetura

### Decisões Técnicas

**Por que Vite (não NextJS)?**
- App é dashboard interno (sem necessidade de SSR/SEO)
- Equipe tem expertise limitada em Node/TS - Vite é mais simples
- Backend Python já existe como API central
- NextJS adicionaria complexidade desnecessária (BFF, deployment extra, learning curve)
- **Decisão documentada**: Ver `docs/poc/1.contexto.md` para análise completa

**Por que Session-based com cookies HttpOnly (não JWT)?**
- Mais seguro contra XSS (JWT em localStorage é vulnerável)
- Permite revogação instantânea de sessão (crítico para sistema de vendas)
- Mais simples que infraestrutura JWT completa (refresh tokens, rotação, blacklist)

**Por que backend único Python (sem BFF Node)?**
- FastAPI já existente e robusto em produção (LLM, RAG, WhatsApp)
- Python é a stack com maior expertise da equipe
- BFF seria overhead de manutenção/deployment para equipe pequena (1 dev)
- KISS: uma stack, um deploy, um ponto de falha

**Por que Python é a stack principal?**
- **Expertise**: Equipe tem domínio muito alto em Python (vs Node/TS básico)
- **Código existente**: Backend MVP já em produção (LLM orchestration, RAG, WhatsApp integration)
- **Source of Truth**: Postgres é gerenciado pelo backend Python
- **Ecossistema IA**: LangChain, LangGraph, bibliotecas de ML/NLP são Python-first
- **Custo-benefício**: Aproveitar conhecimento e código existentes vs reescrever em outra linguagem

**Desenvolvimento e Produção (Mesmo Domínio):**
- **Dev**: Vite proxy redireciona `/api/*` para backend - sem CORS necessário
- **Prod**: Mesmo domínio (`app.pilotodevendas.ia`) servindo frontend estático + API
- FastAPI serve `/` (SPA) + `/api/*` (endpoints) - arquitetura consistente dev/prod
- Cookies: `SameSite=Lax, Secure=True` (máxima segurança em prod)

### Stack
- **Backend**: Python 3.12, FastAPI (async), SQLAlchemy ORM, Postgres
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Router, Axios, Zod
- **Infraestrutura**: Docker Compose (dev), GCP CloudRun + CloudSQL (prod)

### Deployment (Produção)

**Arquivo**: `docs/deployment.md` - guia completo de deploy no GCP Cloud Run

**Arquitetura de produção**:
- **Container único**: `Dockerfile.prod` (3-stage build otimizado)
  - Stage 1: Build do frontend (Node + Vite → `/dist`)
  - Stage 2: Build dependências Python (UV + gcc → `.venv/`)
  - Stage 3: Runtime final (Python slim + .venv + dist, **sem UV, sem gcc**)
- **FastAPI serve tudo**:
  - SPA em `/` (StaticFiles + fallback para `index.html`)
  - API em `/api/*` (routers)
  - Auto-detecta modo dev/prod pela existência de `backend/static/`
- **Cloud SQL**: Postgres gerenciado (conexão via Unix socket)
- **Porta**: 8080 (padrão Cloud Run)
- **Secrets**: Database URL e SECRET_KEY via Secret Manager

**Build local**:
```bash
docker build -f Dockerfile.prod -t pilotodevendas:latest .
docker run -p 8080:8080 pilotodevendas:latest
```

**Deploy**:
```bash
# Via Cloud Build (recomendado)
gcloud builds submit --tag REGION-docker.pkg.dev/PROJECT/pilotodevendas/app --file Dockerfile.prod

# Deploy no Cloud Run
gcloud run deploy pilotodevendas --image ... --add-cloudsql-instances ...
```

Ver `docs/deployment.md` para instruções completas.

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
6. **Prioridade**: KISS (Keep It Simple Stupid) sempre que possível. Ver `docs/poc/1.contexto.md` para diretrizes completas.
7. **Linting antes de commit**: **SEMPRE** executar linting localmente antes de commitar código:
   - **Frontend**: `cd frontend && npm run lint` (deve passar com 0 erros/warnings)
   - **Backend**: `cd backend && uv run ruff check app/ && uv run mypy app/` (ambos devem passar)
   - Isso garante qualidade de código e evita problemas de build em produção
8. **Git**: **NUNCA** use `git commit --amend`. Sempre crie novos commits. Isso preserva o histórico completo e evita problemas de sincronização.
