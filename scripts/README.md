# Scripts de Desenvolvimento

Esta pasta contém scripts auxiliares para setup e manutenção do ambiente de desenvolvimento.

## setup-dev.sh (RECOMENDADO)

**Script principal de setup do ambiente local.**

### O que faz?
1. **Instala UV** (gerenciador de pacotes Python moderno)
2. **Instala Python 3.12** automaticamente via UV (baseado em `.python-version`)
3. **Instala dependências do backend** (FastAPI, SQLAlchemy, etc.)
4. **Verifica Node 18+** (requerido pelo Vite 6)
5. **Instala dependências do frontend** (React, TypeScript, etc.)

### Requisitos
- ✅ **Node.js 18+** (deve estar instalado manualmente)
- ✅ **curl** (para instalar UV)
- ❌ **Python NÃO é necessário!** UV instala automaticamente

### Por que usar?
Sem este setup, IDEs como VS Code não conseguem resolver imports e tipos, gerando erros falsos:
- **PyLance** (Python): Reclama de imports do FastAPI, SQLAlchemy, etc.
- **TypeScript LSP**: Reclama de imports do React, Axios, Zod, etc.

### Quando usar?
- ✅ **Primeira vez** clonando o repositório
- ✅ **Após adicionar** novas dependências (pyproject.toml ou package.json)
- ✅ **IDE reclamando** de imports/tipos não encontrados
- ✅ **Novos desenvolvedores** da equipe

### Como usar?
```bash
./scripts/setup-dev.sh
```

O script é completamente automático (não requer interação).

---

## Próximos Passos

Após rodar `setup-dev.sh`, você pode:

1. **Desenvolvimento com Docker** (recomendado):
   ```bash
   docker compose up --build
   ```

2. **Desenvolvimento local** (sem Docker):
   ```bash
   # Terminal 1 - Backend
   cd backend && uv run uvicorn app.main:app --reload

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

3. **Linting**:
   ```bash
   cd backend && uv run ruff check app/ && uv run mypy app/
   cd frontend && npm run lint
   ```

4. **Testes**:
   ```bash
   cd frontend && npm test
   ```
