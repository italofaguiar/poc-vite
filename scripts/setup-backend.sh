#!/bin/bash
#
# Setup script para desenvolvimento local do backend
# Instala UV e configura ambiente Python
#

set -e  # Exit on error

echo "🚀 Configurando ambiente de desenvolvimento do backend..."

# Check if UV is installed
if ! command -v uv &> /dev/null; then
    echo "📦 UV não encontrado. Instalando UV..."
    curl -LsSf https://astral.sh/uv/install.sh | sh

    # Source cargo env to make uv available in current shell
    export PATH="$HOME/.cargo/bin:$PATH"

    echo "✅ UV instalado com sucesso!"
else
    echo "✅ UV já está instalado"
fi

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

echo "📦 Instalando dependências do backend..."

# Install dependencies using UV sync (native mode)
uv sync

echo "✅ Dependências instaladas com sucesso!"

echo ""
echo "🎉 Setup concluído! Agora você pode:"
echo "   - Rodar o backend: cd backend && uv run uvicorn app.main:app --reload"
echo "   - Rodar linting: cd backend && sh lint.sh"
echo "   - Ou usar Docker: docker compose up --build"
echo ""
