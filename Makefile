.PHONY: help up down restart logs test test-backend test-frontend lint lint-backend lint-frontend clean

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Application lifecycle
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

# Testing
test: test-backend test-frontend ## Run all tests (backend + frontend)

test-backend: ## Run backend tests (pytest)
	docker compose exec backend pytest tests/ -v

test-backend-watch: ## Run backend tests in watch mode
	docker compose exec backend pytest tests/ -v --watch

test-frontend: ## Run frontend tests (vitest)
	docker compose exec frontend npm test

test-frontend-run: ## Run frontend tests once (CI mode)
	docker compose exec frontend npm run test:run

# Linting
lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Run backend linters (ruff + mypy)
	docker compose exec backend ruff check app/
	docker compose exec backend mypy app/

lint-frontend: ## Run frontend linter (eslint)
	docker compose exec frontend npm run lint

# Database
db-reset: ## Reset database (delete volumes and recreate)
	docker compose down -v
	docker compose up --build -d

# Cleanup
clean: ## Stop services and remove volumes
	docker compose down -v

clean-all: ## Stop services, remove volumes, and clean Docker cache
	docker compose down -v
	docker system prune -f
