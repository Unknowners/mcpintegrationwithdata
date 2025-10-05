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
# Supabase конфігурація
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Jira конфігурація (опціонально)
JIRA_URL=https://your-domain.atlassian.net
JIRA_CLIENT_ID=your-jira-client-id
JIRA_CLIENT_SECRET=your-jira-client-secret
JIRA_REFRESH_TOKEN=your-jira-refresh-token

# Notion конфігурація (опціонально)
NOTION_API_KEY=your-notion-api-key

DEBUG=true
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