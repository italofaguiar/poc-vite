.PHONY: help up down restart logs test test-backend test-frontend lint lint-backend lint-frontend clean

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'

#==========================================
# Testing (LOCAL - fast, recommended)
#==========================================

test: test-backend test-frontend ## Run all tests (backend + frontend) - LOCAL

test-backend: ## Run backend tests (pytest) - LOCAL (falls back to Docker if UV not installed)
	@command -v uv >/dev/null 2>&1 && (cd backend && uv run pytest tests/ -v) || \
	(echo "⚠️  UV not found locally. Install with: ./scripts/setup-dev.sh" && \
	 echo "📦 Falling back to Docker..." && \
	 docker compose exec backend pytest tests/ -v)

test-backend-watch: ## Run backend tests in watch mode - LOCAL
	@command -v uv >/dev/null 2>&1 && (cd backend && uv run pytest tests/ -v --watch) || \
	(echo "⚠️  UV not found. Install with: ./scripts/setup-dev.sh" && exit 1)

test-frontend: ## Run frontend tests (vitest) - LOCAL (falls back to Docker if npm not found)
	@command -v npm >/dev/null 2>&1 && (cd frontend && npm test) || \
	(echo "⚠️  npm not found locally. Falling back to Docker..." && \
	 docker compose exec frontend npm test)

test-frontend-run: ## Run frontend tests once (CI mode) - LOCAL
	@command -v npm >/dev/null 2>&1 && (cd frontend && npm run test:run) || \
	(echo "⚠️  npm not found. Install Node.js or use: make test-frontend-docker" && exit 1)

#==========================================
# Linting (LOCAL - fast, recommended)
#==========================================

lint: lint-backend lint-frontend ## Run all linters - LOCAL

lint-backend: ## Run backend linters (ruff + mypy) - LOCAL (falls back to Docker if UV not installed)
	@command -v uv >/dev/null 2>&1 && (cd backend && uv run ruff check app/ && uv run mypy app/) || \
	(echo "⚠️  UV not found. Install with: ./scripts/setup-dev.sh" && \
	 echo "📦 Falling back to Docker..." && \
	 docker compose exec backend sh -c "ruff check app/ && mypy app/")

lint-frontend: ## Run frontend linter (eslint) - LOCAL (falls back to Docker if npm not found)
	@command -v npm >/dev/null 2>&1 && (cd frontend && npm run lint) || \
	(echo "⚠️  npm not found. Falling back to Docker..." && \
	 docker compose exec frontend npm run lint)

#==========================================
# Application lifecycle (Docker Compose)
#==========================================

up: ## Start all services (backend + frontend + db)
	docker compose up --build -d

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

logs: ## Show logs for all services
	docker compose logs -f

logs-backend: ## Show backend logs only
	docker compose logs -f backend

logs-frontend: ## Show frontend logs only
	docker compose logs -f frontend

#==========================================
# Database (Docker)
#==========================================

db-reset: ## Reset database (delete volumes and recreate)
	docker compose down -v
	docker compose up --build -d

#==========================================
# Docker commands (validation/CI)
#==========================================

test-docker: test-backend-docker test-frontend-docker ## Run all tests inside Docker (slower, for validation)

test-backend-docker: ## Run backend tests inside Docker container
	docker compose exec backend pytest tests/ -v

test-frontend-docker: ## Run frontend tests inside Docker container
	docker compose exec frontend npm test

lint-docker: lint-backend-docker lint-frontend-docker ## Run all linters inside Docker

lint-backend-docker: ## Run backend linters inside Docker container
	docker compose exec backend ruff check app/
	docker compose exec backend mypy app/

lint-frontend-docker: ## Run frontend linter inside Docker container
	docker compose exec frontend npm run lint

#==========================================
# Cleanup
#==========================================

clean: ## Stop services and remove volumes
	docker compose down -v

clean-all: ## Stop services, remove volumes, and clean Docker cache
	docker compose down -v
	docker system prune -f
