# Tasks - PilotoDeVendas.IA POC

Roadmap de melhorias baseado nas decisoes de arquitetura e boas praticas.

**Principio**: KISS (Keep It Simple, Stupid) - priorizar simplicidade e consistencia Dev/Prod.

---

## Fase 1: Alinhar Dev/Prod (Remover CORS)

**Objetivo**: Eliminar inconsistencia entre desenvolvimento e producao. Producao usara mesmo dominio (sem CORS), entao dev tambem deve usar.

**Motivacao**:
- Producao = `app.pilotodevendas.ia` serve frontend + API (sem CORS)
- Dev atual = dominios diferentes (`localhost:5173` vs `localhost:8000`) com CORS
- Inconsistencia pode causar bugs que so aparecem em producao

### Tasks:

- [ ] **1.1** Adicionar proxy no `frontend/vite.config.js`
  - Configurar `/api` para proxy para `http://backend:8000`
  - Manter `host: '0.0.0.0'` e `usePolling: true` (Docker)
  - Adicionar `changeOrigin: true` e `secure: false`

- [ ] **1.2** Atualizar `frontend/src/services/api.js`
  - Alterar `baseURL` de `import.meta.env.VITE_API_URL` para `'/'`
  - Manter `withCredentials: true` (cookies continuam necessarios)

- [ ] **1.3** Remover variavel de ambiente `VITE_API_URL`
  - Remover do `frontend/.env` (se existir)
  - Atualizar `frontend/.env.example` (remover referencia)
  - Atualizar `docker-compose.yml` (remover `VITE_API_URL` do servico frontend)

- [ ] **1.4** Remover CORS do backend
  - Comentar/remover `CORSMiddleware` em `backend/app/main.py`
  - Remover imports relacionados a CORS

- [ ] **1.5** Testar funcionalidade completa
  - Reiniciar containers: `docker compose down && docker compose up --build`
  - Testar signup (novo usuario)
  - Testar login (cookie deve ser definido)
  - Testar dashboard (requisicao autenticada)
  - Testar logout (cookie deve ser removido)
  - Verificar no DevTools: sem erros CORS, cookie `session_id` presente

- [ ] **1.6** Atualizar documentacao
  - Atualizar `CLAUDE.md` (secao "Autenticacao" - remover mencao a CORS)
  - Atualizar `CLAUDE.md` (secao "Comandos" - atualizar instrucoes se necessario)

**Criterio de conclusao**: Login/logout/dashboard funcionando sem CORS, dev consistente com arquitetura de producao.

---

## Fase 2: Migracao para TypeScript (.jsx -> .tsx)

**Objetivo**: Adicionar tipagem estatica ao frontend para reduzir bugs e melhorar DX.

**Padrao de tipagem** (pragmatico, nao obsessivo):
- ✅ Tipar props de componentes
- ✅ Tipar respostas da API
- ✅ Tipar estado e hooks quando tipo nao e inferido
- ❌ Evitar tipos complexos/genericos avancados desnecessarios

### Tasks:

- [ ] **2.1** Configurar TypeScript no Vite
  - Criar `frontend/tsconfig.json` (config para React + Vite)
  - Criar `frontend/tsconfig.node.json` (config para Vite config files)
  - Instalar `typescript`: `npm install --save-dev typescript`
  - Verificar se `@types/react` e `@types/react-dom` ja estao em devDependencies

- [ ] **2.2** Renomear arquivos de configuracao
  - `frontend/vite.config.js` -> `frontend/vite.config.ts`

- [ ] **2.3** Migrar componentes (ordem: folha -> raiz)
  - Renomear `frontend/src/components/Chart.jsx` -> `Chart.tsx`
  - Renomear `frontend/src/components/Table.jsx` -> `Table.tsx`
  - Renomear `frontend/src/components/ProtectedRoute.jsx` -> `ProtectedRoute.tsx`
  - Adicionar tipagem de props em cada componente

- [ ] **2.4** Migrar paginas
  - Renomear `frontend/src/pages/Login.jsx` -> `Login.tsx`
  - Renomear `frontend/src/pages/Signup.jsx` -> `Signup.tsx`
  - Renomear `frontend/src/pages/Dashboard.jsx` -> `Dashboard.tsx`
  - Adicionar tipagem de estado e handlers

- [ ] **2.5** Migrar servicos e criar tipos para API
  - Renomear `frontend/src/services/api.js` -> `api.ts`
  - Criar `frontend/src/types/api.ts` com interfaces:
    - `User` (id, email, created_at)
    - `DashboardData` (baseado em resposta real da API)
  - Tipar funcoes do api.ts com tipos criados

- [ ] **2.6** Migrar arquivos raiz
  - Renomear `frontend/src/App.jsx` -> `App.tsx`
  - Renomear `frontend/src/main.jsx` -> `main.tsx`
  - Atualizar `index.html` para referenciar `main.tsx`

- [ ] **2.7** Testar compilacao e execucao
  - Executar `npm run dev` e verificar sem erros TypeScript
  - Executar `npm run build` e verificar build sem erros
  - Testar funcionalidade completa (login, dashboard, logout)

**Criterio de conclusao**: Todo codigo frontend em .tsx, compilando sem erros, aplicacao funcionando normalmente.

---

## Fase 3: Validacao com Zod

**Objetivo**: Adicionar validacao de dados em formularios e respostas da API.

**Escopo**:
- ✅ Validar inputs antes de enviar para API
- ✅ Validar shape de dados retornados pela API
- ❌ Nao duplicar validacoes triviais (backend e fonte da verdade)

### Tasks:

- [ ] **3.1** Instalar Zod
  - Executar: `npm install zod`

- [ ] **3.2** Criar schemas de validacao
  - Criar `frontend/src/schemas/auth.ts`
  - Adicionar schema para signup (email, password com regras)
  - Adicionar schema para login (email, password)
  - Criar `frontend/src/schemas/dashboard.ts`
  - Adicionar schema para validar resposta de `DashboardData`

- [ ] **3.3** Integrar validacao no formulario de Signup
  - Usar Zod para validar antes de enviar request
  - Exibir mensagens de erro apropriadas
  - Manter UX: mostrar erros inline nos campos

- [ ] **3.4** Integrar validacao no formulario de Login
  - Usar Zod para validar antes de enviar request
  - Exibir mensagens de erro apropriadas

- [ ] **3.5** Validar respostas da API
  - Adicionar validacao com Zod em `api.ts` para:
    - `getDashboardData()` - garantir shape correto
    - `getMe()` - garantir User valido
  - Tratar erros de validacao (schema nao bateu = erro de API)

- [ ] **3.6** Testar validacoes
  - Testar signup com email invalido (deve bloquear antes de enviar)
  - Testar signup com senha curta (deve mostrar erro)
  - Testar login com campos vazios (deve validar)
  - Verificar console do navegador sem erros de validacao

**Criterio de conclusao**: Formularios validados antes de submit, respostas da API validadas, mensagens de erro claras.

---

## Fase 4: Melhorias de Tipos e Error Handling

**Objetivo**: Refinar tipagem e melhorar tratamento de erros para producao.

### Tasks:

- [ ] **4.1** Criar tipos compartilhados
  - Criar `frontend/src/types/index.ts` (re-export centralizado)
  - Documentar tipos principais com JSDoc

- [ ] **4.2** Melhorar error handling em `api.ts`
  - Adicionar interceptor Axios para erros HTTP
  - Tipar erros da API (estrutura de erro do FastAPI)
  - Criar helper `isApiError()` para type guards

- [ ] **4.3** Adicionar loading states tipados
  - Criar type `AsyncState<T>` para loading/error/data
  - Aplicar em Dashboard e outras paginas que fazem fetch

- [ ] **4.4** Melhorar feedback visual de erros
  - Criar componente `ErrorMessage.tsx` reutilizavel
  - Usar em Login, Signup, Dashboard para erros de API
  - Adicionar toast/notification para erros globais (opcional)

- [ ] **4.5** Code review e refinamento
  - Revisar todos os arquivos .tsx
  - Remover `any` types (se houver)
  - Adicionar comentarios onde tipagem nao e obvia
  - Verificar ESLint (se configurado)

- [ ] **4.6** Documentacao final
  - Atualizar `CLAUDE.md` com instrucoes TypeScript
  - Documentar estrutura de tipos em comentario ou README
  - Adicionar exemplos de uso de Zod schemas

**Criterio de conclusao**: Tipagem consistente, error handling robusto, codigo documentado.

---

## Fase 5: (Opcional) Testes Basicos

**Objetivo**: Adicionar testes basicos para critical paths (se houver tempo no MVP).

**Nota**: Opcional - focar em features primeiro (KISS). Adicionar testes se sobrar tempo.

### Tasks:

- [ ] **5.1** Configurar Vitest
  - Instalar: `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom`
  - Criar `frontend/vitest.config.ts`
  - Adicionar script `"test": "vitest"` em package.json

- [ ] **5.2** Testes de utilidades
  - Testar schemas Zod (`schemas/auth.test.ts`)
  - Testar helpers de API (`services/api.test.ts`)

- [ ] **5.3** Testes de componentes criticos
  - Testar `ProtectedRoute.tsx` (redireciona se nao autenticado)
  - Testar `Login.tsx` (validacao de form)
  - Testar `Signup.tsx` (validacao de form)

- [ ] **5.4** Executar testes
  - Executar `npm test` e verificar todos passando
  - Adicionar comando de test ao CI (futuro)

**Criterio de conclusao**: Testes basicos rodando, coverage de critical paths.

---

## Metricas de Progresso

| Fase | Tasks Totais | Concluidas | Status |
|------|--------------|------------|--------|
| Fase 1 | 6 | 0 | 🔴 Pendente |
| Fase 2 | 7 | 0 | 🔴 Pendente |
| Fase 3 | 6 | 0 | 🔴 Pendente |
| Fase 4 | 6 | 0 | 🔴 Pendente |
| Fase 5 | 4 | 0 | ⚪ Opcional |

**Total**: 25 tasks obrigatorias + 4 opcionais

---

## Notas

- **Prioridade**: Fases 1-3 sao essenciais para MVP robusto
- **Fase 4**: Pode ser feita incrementalmente durante desenvolvimento de features
- **Fase 5**: Adicionar apenas se houver tempo sobrando
- **KISS**: Se alguma task adicionar complexidade excessiva, reavaliar necessidade
- **Roadmap deployment**: Ver `docs/todo/roadmap-deployment.md` para contexto de producao
