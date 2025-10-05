# 🚀 OnboardAI - Хакатонний проект

> **SaaS-платформа для швидкого та ефективного онбордингу нових співробітників**

OnboardAI допомагає компаніям зменшити час адаптації новачків (time-to-productivity) за рахунок інтерактивної Q&A-системи, автоматичної документації по ролях та інтеграції з основними корпоративними інструментами.

## 🏗️ Архітектура проекту

Проект складається з множинних Docker контейнерів:

- **OnboardAI API** (FastAPI) - Основний сервіс управління онбордингом
- **MCP Jira Server** (Node.js) - Сервер для інтеграції з Jira
- **MCP Notion Server** (Node.js) - Сервер для інтеграції з Notion (порт 3022)
- **Redis** - Кешування та черги завдань
- **Nginx** - Проксі та балансування навантаження

## 🌐 Доступні сервіси та порти

| Сервіс | Порт | Опис | Документація |
|--------|------|------|--------------|
| 🚀 **OnboardAI API** | 8000 | Головний FastAPI сервер | http://localhost:8000/docs |
| 🗄️ **Supabase MCP** | 3033 | DocuMinds інтеграція | http://localhost:3033 |
| 🎯 **Jira MCP** | 3001 | Jira інтеграція | http://localhost:3001 |
| 📚 **Notion MCP** | 3022 | Notion інтеграція | http://localhost:3022 |
| 🔧 **Redis** | 6379 | Кеш та черги | localhost:6379 |

## 📋 Основні ендпоінти

### 🚀 OnboardAI API (Port 8000)
- `GET /health` - Перевірка стану всіх сервісів
- `GET /docs` - Swagger UI документація
- `POST /api/v1/onboarding/create` - Створення плану онбордингу
- `GET /api/v1/progress/{employee_id}` - Прогрес онбордингу
- `GET /api/v1/documinds/resources` - Ресурси з DocuMinds
- `GET /api/v1/qa/answer` - Q&A система
- `POST /api/v1/vectorization/start` - Векторизація знань
- `GET /api/v1/ai/contextual-answer` - AI помічник

### 🗄️ Supabase MCP (Port 3033)
- `GET /health` - Стан сервера
- `GET /api/organizations` - Список організацій
- `GET /api/integrations/{orgId}` - Інтеграції організації
- `GET /api/resources/{integrationId}` - Ресурси інтеграції
- `GET /api/database-info` - Аналіз структури БД

### 🎯 Jira MCP (Port 3001)
- `GET /health` - Стан сервера
- `GET /api/onboarding-tasks` - Задачі онбордингу
- `POST /api/onboarding-tasks` - Створення задачі
- `GET /api/projects/stats` - Статистика проектів

### 📚 Notion MCP (Port 3022)
- `GET /health` - Стан сервера
- `GET /api/onboarding-resources` - Ресурси онбордингу
- `POST /api/search` - Пошук в Notion
- `POST /api/pages` - Створення сторінки

## 🚀 Швидкий запуск

### 1. Підготовка середовища

```bash
# Клонування репозиторію
git clone [your-repo-url]
cd mcpintegrationwithdata

# Налаштування змінних середовища
cp env.example .env
# Відредагуйте .env файл з вашими API ключами
```

### 2. Налаштування API ключів

Відредагуйте `.env` файл:

```env
# DocuMinds Supabase (єдиний джерело правди)
SUPABASE_URL=https://rbmepcfznvcskxayuisp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI та Vector сервіси (глобальні)
OPENAI_API_KEY=sk-your-openai-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-east-1-aws

# ❌ НЕ МАЄ глобальних кредитів до Jira/Notion!
# Кредити отримуються ДИНАМІЧНО з DocuMinds integration_credentials
```

### 3. Запуск проекту

```bash
# Автоматичний запуск (рекомендується)
./start.sh

# Або вручну
docker-compose up -d
```

### 4. Перевірка стану сервісів

```bash
# Перевірка всіх сервісів
node test-services.js

# Перевірка конкретного сервісу
curl http://localhost:8000/health
```

## 🎯 Приклади використання

### 👤 Створення плану онбордингу
```bash
curl -X POST http://localhost:8000/api/v1/onboarding/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Іван Іванов",
    "email": "ivan@techcorp.com",
    "role": "Frontend Developer",
    "department": "Engineering",
    "start_date": "2024-02-01",
    "manager_email": "manager@techcorp.com",
    "skills_required": ["React", "TypeScript"],
    "resources_needed": ["Development Environment"]
  }'
```

### 🤔 Запитання до AI помічника
```bash
curl "http://localhost:8000/api/v1/qa/answer?question=Як налаштувати розробницьке середовище?&role=Frontend Developer"
```

### 📚 Отримання ресурсів з DocuMinds
```bash
curl "http://localhost:8000/api/v1/documinds/resources?organization_domain=techcorp.com&integration_type=notion"
```

### 🧠 Векторизація корпоративних знань
```bash
curl -X POST http://localhost:8000/api/v1/vectorization/start
```

### 3. Запуск проекту

```bash
# Автоматичний запуск (рекомендується)
./start.sh

# Або руками
docker-compose up --build
```

## 📱 Використання API

### Основний OnboardAI API (порт 8000)

#### Створення плану онбордингу

```bash
curl -X POST "http://localhost:8000/api/v1/onboarding/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Іван Петренко",
    "email": "ivan.petrenko@company.com",
    "role": "Frontend Developer",
    "department": "Engineering",
    "start_date": "2024-01-15",
    "manager_email": "manager@company.com",
    "skills_required": ["React", "TypeScript", "CSS"],
    "resources_needed": ["Laptop", "Monitor", "IDE License"]
  }'
```

#### Q&A система

```bash
curl "http://localhost:8000/api/v1/qa/answer?question=як%20розпочати%20роботу&role=Frontend%20Developer"
```

### MCP сервери

#### Jira MCP (порт 3001)

```bash
# Створення задач онбордингу в Jira
curl -X POST "http://localhost:3001/api/jira/onboarding/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "employee_name": "Іван Петренко",
    "email": "ivan@company.com",
    "role": "Frontend Developer",
    "department": "Engineering"
  }'
```

#### Notion MCP (порт 3002)

```bash
# Отримання ресурсів для ролі
curl "http://localhost:3002/api/resources/role/Frontend%20Developer"

# Пошук в базі знань
curl "http://localhost:3002/api/search?query=react&role=Frontend%20Developer"
```

## 🔧 Розробка

### Структура проекту

```
mcpintegrationwithdata/
├── docker-compose.yml          # Docker Compose конфігурація
├── start.sh                    # Скрипт запуску
├── env.example                 # Приклад змінних середовища
├── onboardai-api/              # Основний FastAPI додаток
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── mcp-servers/
│   ├── mcp-jira/              # MCP сервер для Jira
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── index.js
│   └── mcp-notion/            # MCP сервер для Notion
│       ├── Dockerfile
│       ├── package.json
│       └── index.js
└── nginx/
    └── nginx.conf              # Nginx конфігурація
```

### Локальна розробка

```bash
# Запуск тільки бази даних та Redis
docker-compose up redis -d

# Локальний запуск FastAPI
cd onboardai-api
pip install -r requirements.txt
uvicorn main:app --reload

# Локальний запуск MCP серверів
cd mcp-servers/mcp-jira
npm install
npm run dev

cd mcp-servers/mcp-notion
npm install
npm run dev
```

## 🎯 Основні функції

### ✅ Реалізовані можливості

- **Персоналізовані плани онбордингу** - автоматичне створення планів на основі ролі та навичок
- **Q&A система** - інтерактивна система відповідей на базі знань
- **Інтеграція з Jira** - автоматичне створення завдань онбордингу
- **Інтеграція з Notion** - база знань та ресурсів
- **Прогрес трекінг** - відстеження виконання завдань
- **Кешування** - Redis для швидкого доступу до даних
- **Мультисервісна архітектура** - розділення відповідальностей між сервісами

### 🚧 Можливості для хакатону

- **AI-powered рекомендації** - інтеграція LLM для генерації персоналізованих планів
- **Автоматична документація** - створення документації на основі кодбази
- **Інтеграції** - GitHub, Slack, Confluence, Trello
- **Аналітика** - панель статистики онбордингу
- **Мобільний додаток** - React Native додаток для співробітників
- **Менторська система** - автоматичний підбір менторів

## 🐳 Docker команди

```bash
# Зупинка всіх сервісів
docker-compose down

# Перезапуск конкретного сервісу
docker-compose restart onboardai-api

# Подивитися логи
docker-compose logs -f onboardai-api

# Очистити конфігурацію Docker
docker-compose down -v
docker system prune -f
```

## 📊 Моніторинг та здоров'я сервісів

```bash
# Перевірка здоров'я основного API
curl http://localhost:8000/health

# Перевірка Jira MCP
curl http://localhost:3001/api/jira/health

# Перевірка Notion MCP
curl http://localhost:3002/api/notion/health
```

## 🏆 Хакатонні цілі

1. **Демонстрація MVP** - швидко запускається одна команда
2. **Масштабованість** - легко додавати нові MCP сервери
3. **Інтеграції** - готова архітектура для нових інтеграцій
4. **Документація** - повний набор API endpoint'ів
5. **Production-ready** - Nginx, Redis, health checks

## 👥 Команда та внески

- Архітектура та FastAPI додаток
- MCP сервери для інтеграцій
- Docker контейнеризація
- Документація та тестування

---

**💡 Швидкий старт:** Клонуйте репозиторій, налаштуйте `.env` файл та запустіть `./start.sh` - платформа буде доступна на `http://localhost:8000` 🎉

### 🧠 Новий функціонал - Векторні знання!

**🎯 AI-помічник з векторним пошуком:** Додано повноцінний движок семантичного пошуку з інтеграцією OpenAI та Pinecone для інтелектуальних відповідей нових співробітників!