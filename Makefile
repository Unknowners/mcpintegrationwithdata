# OnboardAI - Makefile для управління хакатонним проектом

.PHONY: help build up down logs clean install dev test lint format

# Допомога
help: ## Показати можливі команди
	@echo "OnboardAI - Хакатонний проект"
	@echo ""
	@echo "Доступні команди:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Docker команди
build: ## Збудувати всі Docker контейнери
	docker-compose build

up: ## Запустити всі сервіси
	docker-compose up -d

down: ## Зупинити всі сервіси
	docker-compose down

restart: ## Перезапустити всі сервіси
	docker-compose restart

logs: ## Показати логи всіх сервісів
	docker-compose logs -f

logs-api: ## Показати логи основного API
	docker-compose logs -f onboardai-api

logs-jira: ## Показати логи Jira MCP сервера
	docker-compose logs -f mcp-jira

logs-notion: ## Показати логи Notion MCP сервера
	docker-compose logs -f mcp-notion

# Розробка
install: ## Встановити залежності для розробки
	@echo "Встановлення залежностей для FastAPI..."
	cd onboardai-api && pip install -r requirements.txt
	@echo "Встановлення залежностей для MCP серверів..."
	cd mcp-servers/mcp-jira && npm install
	cd mcp-servers/mcp-notion && npm install

dev: ## Запустити в режимі розробки
	@echo "Запуск в режимі розробки..."
	@echo "Запуск Redis..."
	docker run -d --name onboardai-redis -p 6379:6379 redis:7-alpine || echo "Redis вже запущений"
	@echo "Запуск MCP сервepів..."
	@cd mcp-servers/mcp-jira && npm install >/dev/null 2>&1 || true
	@cd mcp-servers/mcp-notion && npm install >/dev/null 2>&1 || true
	@echo ""
	@echo "Для запуску основних сервісів в окремих терміналах:"
	@echo "1. cd onboardai-api && pip install -r requirements.txt && uvicorn main:app --reload"
	@echo "2. cd mcp-servers/mcp-jira && node index.js"
	@echo "3. cd mcp-servers/mcp-notion && node index.js"
	@echo ""
	@echo "Основний API: http://localhost:8000"
	@echo "Jira MCP: http://localhost:3001"
	@echo "Notion MCP: http://localhost:3002"

local-setup: ## Налаштувати локальне середовище без Docker
	@echo "🚀 Налаштування локального середовища..."
	@echo "Встановлення Python залежностей..."
	cd onboardai-api && pip install -r requirements.txt
	@echo "Встановлення Node.js залежностей..."
	cd mcp-servers/mcp-jira && npm install
	cd mcp-servers/mcp-notion && npm install
	@echo "VPN Redis контейнер..."
	docker run -d --name onboardai-redis -p 6379:6379 redis:7-alpine || echo "Redis вже запущений"
	@echo ""
	@echo "✅ Локальне середовище готове! Тепер запустіть сервіси:"
	@echo "make local-start"

local-start: ## Запустити всі сервіси локально без Docker (окрім Redis)
	@echo "🚀 Запуск локальних сервісів..."
	@./start-local.sh

stop-local: ## Зупинити локальні сервіси
	@echo "🛑 Зупинка локальних сервісів..."
	@pkill -f "node.*index.js" 2>/dev/null || echo "Node процеси не знайдено"
	@pkill -f "uvicorn.*main:app" 2>/dev/null || echo "Uvicorn процеси не знайдено"
	@rm -f /tmp/onboardai-*.pid 2>/dev/null || true
	@echo "✅ Сервіси зупинені"

local-demo: local-setup ## Демо запуск локально
	@echo "🎯 Запуск локального демо..."
	@echo "Це запустить всі сервіси локально для демонстрації"
	@echo "Для зупинки натисніть Ctrl+C"
	@sleep 2
	@./start-local.sh

# Тестування та перевірки
health: ## Перевірити здоров'я всіх сервісів
	@echo "Перевірка здоров'я сервісів..."
	@echo "Основний API:"
	@curl -s http://localhost:8000/health | jq . || echo "Сервіс недоступний"
	@echo ""
	@echo "Jira MCP:"
	@curl -s http://localhost:3001/api/jira/health | jq . || echo "Сервіс недоступний"
	@echo ""
	@echo "Notion MCP:"
	@curl -s http://localhost:3002/api/notion/health | jq . || echo "Сервіс недоступний"

test-all: ## Комплексне тестування всіх сервісів
	@echo "Запуск комплексного тестування..."
	@node test-services.js

test-api: ## Тестування основного API
	@echo "Тестування API endpoints..."
	@echo "Створення тестового онбордингу..."
	@curl -X POST "http://localhost:8000/api/v1/onboarding/create" \
		-H "Content-Type: application/json" \
		-d '{"name": "Test User", "email": "test@company.com", "role": "Frontend Developer", "department": "Engineering", "start_date": "2024-01-15", "manager_email": "manager@company.com", "skills_required": ["React"], "resources_needed": ["Laptop"]}' \
		| jq . || echo "Помилка при тестуванні"

test-jira: ## Тестування Jira MCP
	@echo "Тестування Jira MCP..."
	@curl -X POST "http://localhost:3001/api/jira/onboarding/tasks" \
		-H "Content-Type: application/json" \
		-d '{"employee_id": "TEST001", "employee_name": "Test User", "role": "Frontend Developer"}' \
		| jq . || echo "Помилка при тестуванні"

test-notion: ## Тестування Notion MCP
	@echo "Тестування Notion MCP..."
	@curl "http://localhost:3002/api/resources/role/Frontend%20Developer" | jq . || echo "Помилка при тестуванні"

# Очищення
clean: ## Очистити Docker ресурси
	@echo "Очищення Docker ресурсів..."
	docker-compose down -v
	docker system prune -f

clean-data: ## Очистити дані Redis
	@echo "Очищення Redis даних..."
	docker-compose exec redis redis-cli FLUSHALL || true

# Деплой та продакшн
prod-build: ## Збудувати для продакшну
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-up: ## Запустити продакшн версію
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Утиліти для команди
demo: build up ## Запустити демо версію проекту
	@echo "🚀 Демо запущено!"
	@echo "API документація: http://localhost:8000/docs"
	@echo "Основний API: http://localhost:8000"
	@echo "Jira MCP: http://localhost:3001"
	@echo "Notion MCP: http://localhost:3002"
	@sleep 5
	@make health

stop-all: ## Зупинити всі запущені контейнери
	@echo "Зупинка всіх Docker контейнерів..."
	docker stop $(docker ps -q) 2>/dev/null || true

info: ## Показати інформацію про проект
	@echo "📊 OnboardAI Project Information"
	@echo "==============================="
	@echo ""
	@echo "Архітектура:"
	@echo "• FastAPI (основний додаток) - порт 8000"
	@echo "• MCP Jira Server - порт 3001"
	@echo "• MCP Notion Server - порт 3002"
	@echo "• Redis - порт 6379"
	@echo "• Nginx - порт 80"
	@echo ""
	@echo "Команди для швидкого старту:"
	@echo "• make demo  - швидкий запуск з автоматичними тестами"
	@echo "• make dev   - розробницький запуск"
	@echo "• make install - встановити залежності"
	@echo ""
	@echo "Для детальнішої інформації використовуйте: make help"

# Default target
.DEFAULT_GOAL := help
