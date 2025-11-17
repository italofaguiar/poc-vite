Analise os topicos abaixo, responda minhas duvidas e, após todas sanadas, construa `.mini_specs/tasks.md` com as tasks detalhadas para cada etapa do plano. 

Deve ser um documento markdown separado por Fases e em cada fase deve haver um checklist de tasks a serem realizadas. A medida que as tasks forem sendo concluídas, iremos marcando como feitas.

Por fim, uma vez aprovadas as tasks, iremos executar as tasks para construir a poc.

- [ ] usar .tsx em vez de .jsx no vite.
    - duvida: incentiva a tipar o maximo de coisas? qual o padrao ouro aqui?
- [ ] vai ter proxy no vite para o backend?
- [ ] hot reload no docker compose
- [ ] Zod para validacao de dados no frontend?

---

## TODO: Alinhar Dev/Prod (Remover CORS em Dev)

**Problema atual:**
- **Dev**: Frontend (localhost:5173) + Backend (localhost:8000) = CORS necessário
- **Prod**: Mesmo domínio (app.pilotodevendas.ia) = SEM CORS

**Inconsistência:** Dev usa CORS, prod não. Isso pode causar bugs que só aparecem em produção.

**Solução:** Implementar **Proxy do Vite** para eliminar CORS em dev.

### Como funciona:

```
Browser → localhost:5173/api/login (Vite)
                ↓ (proxy interno)
          backend:8000/api/login (FastAPI)
```

Browser vê tudo como `localhost:5173` → **sem CORS!**

### Implementação:

**1. Vite Config (`frontend/vite.config.js`):**
```js
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Necessário para Docker
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8000',  // Nome do serviço no Docker Compose
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

**2. API Service (`frontend/src/services/api.js`):**
```js
const api = axios.create({
  baseURL: '/',  // ← Não precisa mais de VITE_API_URL
  withCredentials: true,
})
```

**3. Remover `.env` do frontend** (não precisa mais de `VITE_API_URL`)

**4. Remover CORS do backend** (`backend/app/main.py`):
```python
# Remover/comentar configuração CORS:
# app.add_middleware(CORSMiddleware, ...)
```

### Benefícios:

- ✅ Dev e prod consistentes (ambos sem CORS)
- ✅ Menos bugs (CORS é fonte #1 de problemas)
- ✅ Cookies funcionam igual em dev e prod
- ✅ HMR do Vite continua funcionando
- ✅ Mais seguro (SameSite=Lax funciona em dev)

### Tarefas:

- [ ] Adicionar proxy no `vite.config.js`
- [ ] Atualizar `api.js` para `baseURL: '/'`
- [ ] Remover `VITE_API_URL` do `.env` (frontend)
- [ ] Remover CORS do FastAPI
- [ ] Testar login/logout/dashboard em dev
- [ ] Atualizar documentação (README, CLAUDE.md)