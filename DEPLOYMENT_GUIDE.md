# 🚀 Деплой OnboardAI на Live Домен

## 📊 Статус тестування

**Домен:** `https://ai-hack-mcpetc-gcbplx-d53e53-157-180-26-155.traefik.me`  
**Статус:** ❌ Сервіс не запущений (404 на всіх ендпоінтах)

## 🔧 Кроки для деплою

### 1. 🐳 Запуск Docker контейнерів

```bash
# Переконайтеся що Docker запущений
docker --version
docker-compose --version

# Запуск всіх сервісів
./start.sh

# Або вручну
docker-compose up -d
```

### 2. 🌐 Налаштування Traefik

Переконайтеся що у вашому `docker-compose.yml` є правильні labels для Traefik:

```yaml
services:
  onboardai-api:
    # ... інші налаштування
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.onboardai.rule=Host(`ai-hack-mcpetc-gcbplx-d53e53-157-180-26-155.traefik.me`)"
      - "traefik.http.routers.onboardai.entrypoints=websecure"
      - "traefik.http.routers.onboardai.tls.certresolver=letsencrypt"
      - "traefik.http.services.onboardai.loadbalancer.server.port=8000"
```

### 3. 🔍 Перевірка статусу

```bash
# Перевірка запущених контейнерів
docker-compose ps

# Перевірка логів
docker-compose logs onboardai-api

# Перевірка локально
curl http://localhost:8000/health
```

### 4. 🧪 Тестування після деплою

```bash
# Запуск тестування
node test_live_domain.js

# Тестування конкретного сервісу
node test_live_domain.js onboardai-api
```

## 🎯 Очікувані результати

Після успішного деплою ви повинні побачити:

```json
{
  "status": "healthy",
  "services": {
    "api": "✅ running",
    "supabase": "✅ connected", 
    "redis": "✅ connected",
    "mcp_jira": "✅ running",
    "mcp_notion": "✅ running",
    "mcp_supabase": "✅ running"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🚨 Можливі проблеми

### ❌ 404 на всіх ендпоінтах
- **Причина:** Сервіс не запущений або неправильна конфігурація Traefik
- **Рішення:** Перевірте `docker-compose ps` та логи

### ❌ SSL помилки
- **Причина:** Проблеми з сертифікатами
- **Рішення:** Перевірте налаштування `letsencrypt` в Traefik

### ❌ Таймаути
- **Причина:** Повільний запуск сервісів
- **Рішення:** Збільште `timeout` в тестах або дочекайтеся повного запуску

## 📋 Чек-лист деплою

- [ ] Docker та Docker Compose встановлені
- [ ] `.env` файл налаштований з правильними ключами
- [ ] Traefik правильно налаштований
- [ ] Всі контейнери запущені (`docker-compose ps`)
- [ ] Локальні тести проходять (`curl http://localhost:8000/health`)
- [ ] Live домен відповідає (`node test_live_domain.js`)

## 🎉 Після успішного деплою

1. **Swagger документація:** `https://ai-hack-mcpetc-gcbplx-d53e53-157-180-26-155.traefik.me/docs`
2. **Health check:** `https://ai-hack-mcpetc-gcbplx-d53e53-157-180-26-155.traefik.me/health`
3. **API тестування:** Використовуйте приклади з `COMPLETE_SERVICES_DOCUMENTATION.md`

## 🚀 Готово для демонстрації!

Після успішного деплою платформа буде готова для:
- ✅ Демонстрації інвесторам
- ✅ Тестування клієнтами  
- ✅ Production використання
- ✅ Масштабування
