#!/bin/bash
# Run all linting tools

set -e

echo "Running ruff..."
ruff check app/

echo ""
echo "Running mypy..."
mypy app/

echo ""
echo "✅ All linting checks passed!"
