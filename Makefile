.PHONY: help up down restart logs test test-backend test-frontend test-e2e test-all lint lint-backend lint-frontend clean

# Default target
.DEFAULT_GOAL := help

# Add common UV installation paths to PATH
export PATH := $(HOME)/.local/bin:/usr/local/bin:$(PATH)

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'

#==========================================
# Testing (LOCAL - fast, recommended)
#==========================================

test: test-backend test-frontend ## Run unit tests (backend + frontend) - LOCAL

test-backend: ## Run backend tests (pytest) - LOCAL (requires UV)
	cd backend && uv run pytest tests/ -v

test-backend-watch: ## Run backend tests in watch mode - LOCAL
	cd backend && uv run pytest tests/ -v --watch

test-frontend: ## Run frontend unit tests (vitest) - LOCAL (requires npm)
	cd frontend && npm test

test-frontend-run: ## Run frontend unit tests once (CI mode) - LOCAL
	cd frontend && npm run test:run

test-e2e: ## Run E2E tests (Playwright) - LOCAL (requires Docker Compose up)
	cd frontend && npm run test:e2e

test-all: test-backend test-frontend-run test-e2e ## Run ALL tests (unit + E2E) - LOCAL

#==========================================
# Linting (LOCAL - fast, recommended)
#==========================================

lint: lint-backend lint-frontend ## Run all linters - LOCAL

lint-backend: ## Run backend linters (ruff + mypy) - LOCAL (requires UV)
	cd backend && uv run ruff check app/
	cd backend && uv run mypy app/

lint-frontend: ## Run frontend linter (eslint) - LOCAL (requires npm)
	cd frontend && npm run lint

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
