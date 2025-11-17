#!/bin/bash
# Run all linting tools

set -e

echo "Running ruff..."
uv run ruff check app/

echo ""
echo "Running mypy..."
uv run mypy app/

echo ""
echo "✅ All linting checks passed!"
