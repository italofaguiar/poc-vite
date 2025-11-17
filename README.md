# PilotoDeVendas.IA - POC de Autenticação

POC para validação da arquitetura de autenticação do PilotoDeVendas.IA - um SaaS de automação de vendas via WhatsApp com IA.

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

- `POST /api/auth/signup` - Criar nova conta
  - Body: `{"email": "user@example.com", "password": "senha123"}`
  - Resposta: 201 Created + cookie `session_id`

- `POST /api/auth/login` - Fazer login
  - Body: `{"email": "user@example.com", "password": "senha123"}`
  - Resposta: 200 OK + cookie `session_id`

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

1. **Signup**: Usuário cria conta → backend valida → cria hash bcrypt → salva no DB → cria sessão → retorna cookie
2. **Login**: Usuário faz login → backend valida credenciais → cria sessão → retorna cookie
3. **Acesso Protegido**: Request com cookie → backend valida sessão → permite acesso
4. **Logout**: Request para logout → backend invalida sessão → remove cookie

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

## Próximos Passos (Produção)

1. **Redis**: Substituir sessões in-memory por Redis
2. **HTTPS**: Configurar SSL/TLS em produção
3. **Domínio único**: Servir frontend + backend no mesmo domínio (evita CORS)
4. **CloudRun + CloudSQL**: Deploy em GCP
5. **Monitoring**: Logs estruturados, métricas, alertas
6. **Rate Limiting**: Proteção contra brute force
7. **Testes automatizados**: Unit tests + integration tests

## Documentação Adicional

- `CLAUDE.md` - Guia para desenvolvimento com Claude Code
- `docs/1.contexto.md` - Contexto completo do projeto
- `.mini_specs/tasks.md` - Roadmap da POC (8 fases)

## Licença

Proprietary - PilotoDeVendas.IA
