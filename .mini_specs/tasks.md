# Tasks POC - PilotoDeVendas.IA Frontend

## Fase 1: Setup Inicial & Infraestrutura

- [x] Criar estrutura de pastas do projeto
  - [x] `backend/app/` com subpastas `routers/`
  - [x] `frontend/src/` com subpastas `pages/`, `components/`, `services/`
- [x] Criar `docker-compose.yml` com 3 serviços (frontend, backend, db)
- [x] Criar `.env.example` com variáveis de ambiente necessárias
- [x] Criar `.gitignore` adequado (node_modules, __pycache__, .env, etc)

---

## Fase 2: Backend - Database & Models

- [x] Criar `backend/requirements.txt` com dependências:
  - [x] fastapi, uvicorn, sqlalchemy, psycopg2-binary, python-dotenv
  - [x] passlib[bcrypt], python-multipart, itsdangerous
- [x] Criar `backend/Dockerfile` para imagem Python 3.12
- [x] Criar `backend/app/database.py` com:
  - [x] Configuração SQLAlchemy engine
  - [x] SessionLocal factory
  - [x] Base declarativa
  - [x] Função `get_db()` dependency
- [x] Criar `backend/app/models.py` com modelo `User`:
  - [x] Campos: id (PK), email (unique), password_hash, created_at
  - [x] Index no campo email
- [x] Criar script/função para criar tabelas no banco

---

## Fase 3: Backend - Autenticação

- [x] Criar `backend/app/schemas.py` com Pydantic schemas:
  - [x] `UserSignup` (email, password)
  - [x] `UserLogin` (email, password)
  - [x] `UserResponse` (id, email, created_at)
- [x] Criar `backend/app/auth.py` com funções de sessão:
  - [x] `hash_password(password: str)` usando bcrypt
  - [x] `verify_password(plain: str, hashed: str)`
  - [x] `create_session(user_id: int)` retorna session_id
  - [x] `get_user_from_session(session_id: str)` valida e retorna user_id
  - [x] `delete_session(session_id: str)` invalida sessão
- [x] Criar `backend/app/routers/auth.py` com endpoints:
  - [x] `POST /api/auth/signup` - cria usuário + retorna cookie
  - [x] `POST /api/auth/login` - valida credenciais + retorna cookie
  - [x] `POST /api/auth/logout` - invalida sessão + limpa cookie
  - [x] `GET /api/auth/me` - verifica sessão ativa + retorna user info
- [x] Criar `backend/app/main.py`:
  - [x] Instanciar FastAPI app
  - [x] Configurar CORS middleware para `http://localhost:5173`
  - [x] Incluir router de auth
  - [x] Endpoint raiz GET / para health check

---

## Fase 4: Backend - API Dashboard

- [x] Criar `backend/app/routers/dashboard.py`:
  - [x] `GET /api/dashboard/data` (protegido por sessão)
  - [x] Retornar dados dummy para gráfico (lista de objetos com data/valor)
  - [x] Retornar dados dummy para tabela (lista de objetos com id/nome/status/valor)
- [x] Incluir router dashboard no `main.py`
- [ ] Testar endpoint com curl/Postman (verificar proteção de sessão)

---

## Fase 5: Frontend - Setup & Estrutura

- [x] Criar `frontend/package.json` com dependências:
  - [x] react, react-dom, react-router-dom
  - [x] axios, recharts
  - [x] Vite como dev dependency
- [x] Criar `frontend/Dockerfile` para imagem Node 20
- [x] Criar `frontend/vite.config.js`:
  - [x] Configurar port 5173
  - [x] Configurar proxy para backend (opcional, se não usar CORS)
- [x] Instalar e configurar TailwindCSS:
  - [x] `tailwind.config.js`
  - [x] Importar no CSS principal
- [x] Criar `frontend/src/main.jsx` como entry point
- [x] Criar `frontend/src/App.jsx` com React Router:
  - [x] Rotas: `/login`, `/signup`, `/dashboard`
  - [x] Rota default redirect para `/login`

---

## Fase 6: Frontend - Autenticação

- [x] Criar `frontend/src/services/api.js`:
  - [x] Configurar axios instance com `baseURL: http://localhost:8000`
  - [x] Configurar `withCredentials: true` para cookies
  - [x] Funções: `signup()`, `login()`, `logout()`, `getMe()`
- [x] Criar `frontend/src/pages/Signup.jsx`:
  - [x] Formulário com email + password
  - [x] Validação básica (email válido, senha mínima)
  - [x] Chamar api.signup() e redirecionar para dashboard
  - [x] Mostrar erros de API
- [x] Criar `frontend/src/pages/Login.jsx`:
  - [x] Formulário com email + password
  - [x] Chamar api.login() e redirecionar para dashboard
  - [x] Link para página de signup
  - [x] Mostrar erros de API
- [x] Criar componente `ProtectedRoute`:
  - [x] Chamar api.getMe() antes de renderizar
  - [x] Se não autenticado, redirecionar para `/login`
  - [x] Aplicar em rota `/dashboard`

---

## Fase 7: Frontend - Dashboard

- [ ] Criar `frontend/src/services/api.js`:
  - [ ] Adicionar função `getDashboardData()`
- [ ] Criar `frontend/src/components/Chart.jsx`:
  - [ ] Usar Recharts (LineChart ou BarChart)
  - [ ] Receber dados via props
  - [ ] Estilizar com TailwindCSS
- [ ] Criar `frontend/src/components/Table.jsx`:
  - [ ] Renderizar tabela HTML com dados via props
  - [ ] Colunas: ID, Nome, Status, Valor
  - [ ] Estilizar com TailwindCSS
- [ ] Criar `frontend/src/pages/Dashboard.jsx`:
  - [ ] Chamar api.getDashboardData() no useEffect
  - [ ] Renderizar componente Chart com dados
  - [ ] Renderizar componente Table com dados
  - [ ] Botão de logout que chama api.logout()
  - [ ] Loading state enquanto carrega dados

---

## Fase 8: Integração & Testes

- [ ] Subir ambiente completo com `docker-compose up --build`
- [ ] Testar fluxo completo:
  - [ ] Acessar http://localhost:5173
  - [ ] Criar nova conta (signup)
  - [ ] Verificar redirecionamento para dashboard
  - [ ] Verificar gráfico e tabela renderizando
  - [ ] Fazer logout
  - [ ] Fazer login novamente com mesma conta
  - [ ] Verificar que dashboard carrega corretamente
- [ ] Validar cookies no DevTools:
  - [ ] Cookie HttpOnly presente após login
  - [ ] Cookie removido após logout
- [ ] Validar CORS:
  - [ ] Verificar que requests do frontend funcionam
  - [ ] Verificar headers CORS no Network tab
- [ ] Criar `README.md` básico:
  - [ ] Instruções para rodar com docker-compose
  - [ ] Variáveis de ambiente necessárias
  - [ ] Endpoints da API
  - [ ] Screenshots (opcional)

---

## Notas

- Marcar tasks como `[x]` conforme forem sendo concluídas
- Cada fase deve ser completada antes de iniciar a próxima
- Se encontrar bloqueios, documentar e ajustar tasks conforme necessário
