#!/bin/bash
#
# Setup completo do ambiente de desenvolvimento local
#
# PROPÓSITO:
# Este script configura o ambiente local para desenvolvimento, instalando todas as
# dependências necessárias do backend (Python + UV) e frontend (Node + npm).
#
# POR QUE EXISTE?
# Sem este setup, IDEs como VS Code (PyLance, TypeScript LSP) não conseguem resolver
# imports e tipos, gerando erros falsos no editor. O script garante que:
# - UV está instalado (gerenciador de pacotes Python moderno)
# - Python 3.12 está disponível (instalado automaticamente via UV)
# - Dependências Python estão sincronizadas (FastAPI, SQLAlchemy, etc.)
# - Node 18+ está disponível (requerido pelo Vite 6)
# - Dependências npm do frontend estão instaladas (React, TypeScript, etc.)
#
# REQUISITOS:
# - Node.js 18+ (deve estar instalado manualmente)
# - Python 3.12+ NÃO É NECESSÁRIO (UV instala automaticamente!)
# - curl (para instalar UV)
#
# QUANDO USAR?
# - Primeira vez clonando o repositório
# - Após adicionar novas dependências no pyproject.toml ou package.json
# - Quando sua IDE reclama de imports/tipos não encontrados
# - Para novos desenvolvedores da equipe
#
# NOTA: Para desenvolvimento com hot-reload, use `docker compose up --build` após este setup.
#

set -e  # Exit on error

# Salvar diretório raiz do projeto
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "🚀 Configurando ambiente de desenvolvimento completo..."
echo ""

#
# 1. INSTALAR UV
#
echo "📦 Verificando UV (gerenciador de pacotes Python)..."

if ! command -v uv &> /dev/null; then
    echo "   UV não encontrado. Instalando..."
    curl -LsSf https://astral.sh/uv/install.sh | sh

    # Adicionar UV ao PATH (instalado em ~/.local/bin por padrão)
    export PATH="$HOME/.local/bin:$PATH"

    # Verificar se UV está disponível agora
    if ! command -v uv &> /dev/null; then
        echo "❌ Erro: UV foi instalado mas não está disponível no PATH"
        echo "   Tente adicionar ao seu ~/.bashrc ou ~/.zshrc:"
        echo "   export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo "   Depois, reinicie o terminal e execute novamente."
        exit 1
    fi

    echo "✅ UV instalado com sucesso!"
else
    echo "✅ UV já está instalado ($(uv --version))"
fi

#
# 2. GARANTIR PYTHON 3.12 VIA UV
#
echo ""
echo "🐍 Verificando Python 3.12..."

# Navegar para o backend (onde está .python-version)
cd "$PROJECT_ROOT/backend"

# UV automaticamente detecta .python-version e instala se necessário
echo "   Instalando/verificando Python 3.12 via UV..."
uv python install

# Verificar versão instalada
PYTHON_VERSION=$(uv run python --version 2>&1 | grep -oP '\d+\.\d+' || echo "unknown")
echo "✅ Python $PYTHON_VERSION disponível via UV"

#
# 3. INSTALAR DEPENDÊNCIAS DO BACKEND
#
echo ""
echo "📦 Instalando dependências do backend (Python)..."

# Já estamos em backend/ da seção anterior
uv sync

echo "✅ Dependências do backend instaladas!"

#
# 4. VERIFICAR NODE.JS
#
echo ""
echo "🟢 Verificando Node.js..."

cd "$PROJECT_ROOT"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo "Por favor, instale Node.js 18+ antes de continuar:"
    echo "   https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

echo "   Node.js v$(node -v | cut -d'v' -f2) encontrado"

# Verificar versão mínima (Node 18+, requerido pelo Vite 6)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  ATENÇÃO: Node.js $NODE_VERSION detectado, mas Vite 6 requer Node.js 18+"
    echo ""
    read -p "   Deseja continuar mesmo assim? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelado. Instale Node.js 18+ e tente novamente."
        exit 1
    fi
fi

echo "✅ Node.js v$(node -v | cut -d'v' -f2) OK (>= 18)"

#
# 5. VERIFICAR NPM
#
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado!"
    exit 1
fi

echo "✅ npm $(npm -v) encontrado"

#
# 6. INSTALAR DEPENDÊNCIAS DO FRONTEND
#
echo ""
echo "📦 Instalando dependências do frontend (npm)..."

cd "$PROJECT_ROOT/frontend"
npm install

echo "✅ Dependências do frontend instaladas!"

#
# 7. RESUMO FINAL
#
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Setup concluído com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Instalado:"
echo "   - UV ($(uv --version))"
echo "   - Python $PYTHON_VERSION (via UV)"
echo "   - Node.js v$(node -v | cut -d'v' -f2)"
echo "   - Dependências backend + frontend"
echo ""
echo "📚 Próximos passos:"
echo ""
echo "   DESENVOLVIMENTO COM DOCKER (recomendado):"
echo "   $ docker compose up --build"
echo "   → Backend: http://localhost:8000"
echo "   → Frontend: http://localhost:5173"
echo ""
echo "   DESENVOLVIMENTO LOCAL (sem Docker):"
echo "   Terminal 1 - Backend:"
echo "   $ cd backend && uv run uvicorn app.main:app --reload"
echo ""
echo "   Terminal 2 - Frontend:"
echo "   $ cd frontend && npm run dev"
echo ""
echo "   LINTING:"
echo "   $ cd backend && uv run ruff check app/ && uv run mypy app/"
echo "   $ cd frontend && npm run lint"
echo ""
echo "   TESTES:"
echo "   $ cd frontend && npm test"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
