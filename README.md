# PilotoDeVendas.IA - POC de Autenticação

## Sobre o Projeto

**PilotoDeVendas.IA** é uma plataforma SaaS de automação de vendas via WhatsApp com Inteligência Artificial, voltada para pequenos e médios empresários.

### Capacidades da Plataforma

A plataforma opera em dois modos:
- **Modo Piloto**: IA assume a negociação de forma autônoma
- **Modo Copiloto**: Auxilia vendedores humanos em tempo real com sugestões de respostas

**Principais funcionalidades:**
- 💬 Integração com WhatsApp (oficial WABA e não-oficial Z-API/Evolution API)
- 🤖 Qualificação de leads (SDR) e suporte a vendas com IA
- 🔄 Sincronização em tempo real com CRM da empresa (via webhooks)
- 📚 RAG (Retrieval-Augmented Generation) com base de conhecimento da empresa
- 🎙️ Processamento e resposta de áudio com clonagem de voz
- 📄 Interpretação de imagens, PDF, DOCX
- 📅 Régua de follow-up customizável
- 🧠 Aprendizado contínuo (IA aprende com dúvidas para não repetir perguntas)
- 📊 Dashboards de métricas de performance
- 🔍 Auditoria de atendimentos humanos com extração de insights
- 🔗 Integrações (Google Calendar, CRMs, Stripe, etc.)

### Sobre esta POC

Este repositório contém uma **POC (Proof of Concept)** focada em validar a **arquitetura de autenticação** para o frontend da aplicação:
- Backend Python (FastAPI) + Frontend React (Vite) + PostgreSQL
- Autenticação session-based com cookies HttpOnly
- Decisão técnica: **Vite** (não NextJS) - ver `CLAUDE.md` para justificativas

## Stack Tecnológica

- **Backend**: Python 3.12, FastAPI (async), SQLAlchemy ORM
- **Frontend**: React 18, Vite, TailwindCSS, React Router
- **Banco de Dados**: PostgreSQL 16
- **Infraestrutura**: Docker Compose

## Arquitetura de Autenticação

**Session-based com cookies HttpOnly:**
- Cookie `session_id` com flags: `HttpOnly`, `Secure`, `SameSite=Lax`
- Sessões armazenadas in-memory (produção usará Redis)
- Expiração: 7 dias
- CORS configurado para `http://localhost:5173` com `credentials: true`

## Como Rodar

### Requisitos

- Docker e Docker Compose
- Portas livres: 5173 (frontend), 8000 (backend), 5432 (database)

### Iniciar Aplicação

```bash
# Clonar o repositório
git clone <repository-url>
cd poc-vite-claude

# Criar arquivo .env (usar .env.example como base)
cp .env.example .env

# Subir ambiente completo
docker compose up --build

# Acessar aplicação
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
```

### Comandos Úteis

```bash
# Subir apenas backend + database
docker compose up backend db

# Ver logs de um serviço
docker compose logs -f backend

# Acessar container do backend
docker exec -it poc-vite-backend bash

# Recriar database (apaga volumes)
docker compose down -v && docker compose up --build

# Parar ambiente
docker compose down
```

## Variáveis de Ambiente

Ver arquivo `.env.example` para referência completa.

Principais variáveis:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=pilotodevendas

# Backend
SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development

# Frontend
VITE_API_URL=http://localhost:8000
```

## Endpoints da API

### Autenticação

**Email/Senha:**
- `POST /api/auth/signup` - Criar nova conta
  - Body: `{"email": "user@example.com", "password": "senha123"}`
  - Resposta: 201 Created + cookie `session_id`

- `POST /api/auth/login` - Fazer login
  - Body: `{"email": "user@example.com", "password": "senha123"}`
  - Resposta: 200 OK + cookie `session_id`

**OAuth Google:**
- `GET /api/auth/google/login` - Iniciar fluxo OAuth
  - Resposta: 302 Redirect para Google consent screen

- `GET /api/auth/google/callback` - Callback após autorização
  - Query params: `code`, `state` (gerenciados pelo Google)
  - Resposta: 302 Redirect para `/dashboard` + cookie `session_id`

**Sessão:**
- `POST /api/auth/logout` - Fazer logout
  - Headers: Cookie `session_id`
  - Resposta: 200 OK (remove cookie)

- `GET /api/auth/me` - Verificar sessão ativa
  - Headers: Cookie `session_id`
  - Resposta: 200 OK + user info

### Dashboard (Protegido)

- `GET /api/dashboard/data` - Buscar dados do dashboard
  - Headers: Cookie `session_id`
  - Resposta: 200 OK + dados de gráfico e tabela

### Health Check

- `GET /` - Verificar status da API
  - Resposta: 200 OK

## Estrutura do Projeto

```
.
├── backend/
│   ├── app/
│   │   ├── routers/         # Rotas (auth.py, dashboard.py)
│   │   ├── models.py        # Models SQLAlchemy
│   │   ├── schemas.py       # Schemas Pydantic
│   │   ├── database.py      # Configuração DB
│   │   ├── auth.py          # Gestão de sessões
│   │   └── main.py          # App FastAPI
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # Login, Signup, Dashboard
│   │   ├── components/      # ProtectedRoute, Chart, Table
│   │   └── services/        # api.js (axios config)
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Fluxo de Autenticação

### Email/Senha (Tradicional)
1. **Signup**: Usuário cria conta → backend valida → cria hash bcrypt → salva no DB → cria sessão → retorna cookie
2. **Login**: Usuário faz login → backend valida credenciais → cria sessão → retorna cookie
3. **Acesso Protegido**: Request com cookie → backend valida sessão → permite acesso
4. **Logout**: Request para logout → backend invalida sessão → remove cookie

### OAuth Google (Account Linking)
1. **Redirect para Google**: `GET /api/auth/google/login` → redireciona para consentimento do Google
2. **Callback**: Google retorna com código → backend valida token → extrai email e google_id
3. **Merge/Criação de Usuário** (ver `backend/app/routers/auth.py:273-297`):
   - Busca usuário por `google_id` → se encontrar, usa esse usuário
   - Se não encontrar por `google_id`, busca por `email`:
     - **Usuário já existe** (criado via email/senha): vincula `google_id` à conta existente (merge)
     - **Usuário não existe**: cria novo usuário com `auth_provider="google"`
4. **Sessão**: Cria sessão e retorna cookie → redireciona para dashboard

**Importante**: OAuth Google faz **account linking** automático - se você já tem conta com aquele email (criada via signup tradicional), o login do Google vincula sua conta Google à conta existente, não cria duplicata.

## Validações Realizadas

### Testes E2E (Playwright)
- ✅ Signup com novo usuário
- ✅ Redirecionamento automático para dashboard após signup
- ✅ Dashboard renderiza gráfico e tabela corretamente
- ✅ Logout funciona e redireciona para login
- ✅ Login com credenciais existentes
- ✅ Dashboard carrega após login

### Validação de Segurança
- ✅ Cookie `session_id` com flags corretas: `HttpOnly`, `SameSite=Lax`, `Max-Age=604800`
- ✅ Endpoint protegido bloqueia acesso sem cookie (401 Unauthorized)
- ✅ Endpoint protegido permite acesso com cookie válido (200 OK)

### Validação CORS
- ✅ Headers CORS presentes em preflight (OPTIONS)
- ✅ Headers CORS presentes em requests reais (POST/GET)
- ✅ `Access-Control-Allow-Origin: http://localhost:5173`
- ✅ `Access-Control-Allow-Credentials: true`
- ✅ Frontend consegue fazer requests com cookies

## Próximos Passos (Produção - Infraestrutura)

1. **Redis**: Substituir sessões in-memory por Redis
2. **HTTPS**: Configurar SSL/TLS em produção
3. **Domínio único**: Servir frontend + backend no mesmo domínio (evita CORS)
4. **CloudRun + CloudSQL**: Deploy em GCP
5. **Monitoring**: Logs estruturados, métricas, alertas
6. **Rate Limiting**: Proteção contra brute force
7. **Testes automatizados**: Unit tests + integration tests

## Roadmap do Produto

### Curto Prazo (2 meses)
**Frontend da aplicação:**
- ✅ Autenticação (email/senha + OAuth Google) - **POC concluída**
- ⏳ Configuração de agentes de IA (prompts, tools, régua de follow-up)
- ⏳ Gestão de RAG (upload de arquivos + integração com Google Drive)
- ⏳ Dashboards de performance dos agentes

### Médio Prazo (4 meses)
**Plataforma completa:**
- Gestão de usuários (vendedores, admins, permissões)
- Interface de atendimento (similar ao WhatsApp Web)
- Modo Copiloto (análise em tempo real + sugestões de respostas)
- Logs de atendimentos de vendedores humanos
- Assinaturas e pagamentos (Stripe)
- Integrações nativas com CRMs populares e Google Calendar

## Documentação Adicional

- `CLAUDE.md` - Guia para desenvolvimento com Claude Code
- `docs/1.contexto.md` - Contexto completo do projeto
- `.mini_specs/tasks.md` - Roadmap da POC (8 fases)
- **`docs/todo/`** - Estratégias e tarefas futuras (deployment, escalabilidade, etc)

## Licença

Proprietary - PilotoDeVendas.IA
