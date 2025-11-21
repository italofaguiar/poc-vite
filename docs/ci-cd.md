# CI/CD - GitHub Actions

Pipeline automático de integração e deploy para Cloud Run.

## Como Funciona

**Trigger**: Push ou Pull Request na branch `main`

**Workflow**:
```
Pull Request → Lint + Test → Feedback no PR ✅/❌
Merge na main → Lint + Test + Deploy → Cloud Run atualizado
```

**Jobs**:
1. **Lint** (paralelo): Backend (ruff + mypy) + Frontend (ESLint)
2. **Test** (paralelo): Testes unitários + integração (Postgres)
3. **Build & Deploy** (sequencial): Docker → Artifact Registry → Cloud Run

## Quando Deploy Acontece

- ✅ **Merge na `main`**: Deploy automático
- ❌ **Pull Request**: Apenas lint e test (sem deploy)

## Como Debugar Falhas

**Ver logs do workflow**:
```bash
gh run list --limit 5                           # Listar workflows recentes
gh run view <RUN_ID> --log-failed               # Ver logs de falhas
gh run watch <RUN_ID>                           # Acompanhar em tempo real
```

**Problemas comuns**:
- **Lint falha**: `make lint` antes de commitar
- **Test falha**: `make test` antes de commitar
- **Deploy falha**: Verificar logs no GitHub Actions e Cloud Run

## Adicionar Novos Jobs/Steps

Edite `.github/workflows/ci-cd.yml`:

```yaml
jobs:
  novo-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Seu comando aqui"
```

**Importante**: Jobs que dependem de outros usam `needs: [job1, job2]`

## Links Úteis

- **Workflows**: https://github.com/italofaguiar/poc-vite/actions
- **Secrets**: https://github.com/italofaguiar/poc-vite/settings/secrets/actions
- **App em produção**: https://poc-vite-uasawowwvq-ue.a.run.app
