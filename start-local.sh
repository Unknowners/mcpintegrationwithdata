#!/bin/bash

echo "🚀 Локальний запуск OnboardAI сервісів..."

# Зупинка існуючих процесів
echo "🛑 Зупинка існуючих процесів..."
pkill -f "node.*index.js" 2>/dev/null || true
pkill -f "uvicorn.*main:app" 2>/dev/null || true

# Запуск Redis якщо не запущен
echo "📦 Запуск Redis..."
if ! docker ps | grep -q onboardai-redis; then
    docker run -d --name onboardai-redis -p 6379:6379 redis:7-alpine
fi

echo "⏳ Очікування запуску контейнерів..."
sleep 2

# Перевірка Redis
if docker ps | grep -q onboardai-redis; then
    echo "✅ Redis запущений на порту 6379"
else
    echo "❌ Redis не запущений"
    exit 1
fi

# Запуск MCP серверів
echo "📱 Запуск MCP серверів..."

# Jira MCP
echo "  🔧 Запуск Jira MCP..."
cd /Users/anton/Desktop/mcpintegrationwithdata/mcp-servers/mcp-jira
node index.js &
JIRA_PID=$!
sleep 2

if curl -s http://localhost:3001/api/jira/health >/dev/null 2>&1; then
    echo "  ✅ Jira MCP запущений на порту 3001 (PID: $JIRA_PID)"
else
    echo "  ❌ Jira MCP не запустився"
fi

# Notion MCP
echo "  📝 Запуск Notion MCP..."
cd /Users/anton/Desktop/mcpintegrationwithdata/mcp-servers/mcp-notion
node index.js &
NOTION_PID=$!
sleep 2

if curl -s http://localhost:3022/api/notion/health >/dev/null 2>&1; then
    echo "  ✅ Notion MCP запущений на порту 3022 (PID: $NOTION_PID)"
else
    echo "  ❌ Notion MCP не запустився"
fi

# Основний API
echo "🏗️ Запуск OnboardAI API..."
cd /Users/anton/Desktop/mcpintegrationwithdata/onboardai-api

# Запуск з правильним біндингом IPv4
PYTHONPATH=/Users/anton/Desktop/mcpintegrationwithdata/onboardai-api uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
API_PID=$!

sleep 3

if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "  ✅ OnboardAI API запущений на порту 8000 (PID: $API_PID)"
else
    echo "  ❌ OnboardAI API не запустився"
fi

echo ""
echo "🎉 Сервіси запущені!"
echo "==============================="
echo "📖 API документація: http://localhost:8000/docs"
echo "🔧 Jira MCP: http://localhost:3001"
echo "📝 Notion MCP: http://localhost:3002"
echo "🔴 Redis: localhost:6379"
echo ""
echo "Для зупинки всіх сервісів натисніть Ctrl+C або запустіть 'make stop-local'"

# Збереження PID файлів
echo $JIRA_PID > /tmp/onboardai-jira.pid
echo $NOTION_PID > /tmp/onboardai-notion.pid  
echo $API_PID > /tmp/onboardai-api.pid

# Очікування зупинки
trap 'echo "Зупинка сервісів..."; kill $JIRA_PID $NOTION_PID $API_PID 2>/dev/null; rm -f /tmp/onboardai-*.pid; echo "✅ Сервіси зупинені"; exit 0' INT TERM

# Очищення при виході
cleanup() {
    echo "Зупинка сервісів..."
    kill $JIRA_PID $NOTION_PID $API_PID 2>/dev/null
    rm -f /tmp/onboardai-*.pid
    echo "✅ Сервіси зупинені"
    exit 0
}

# Перенаправлення сигналів
trap cleanup INT TERM EXIT

echo ""
echo "Натисніть Ctrl+C для зупинки всіх сервісів..."
echo "Тестування доступно командою 'make test-all'"
echo ""

# Тестування
sleep 2
echo "🧪 Автоматичне тестування..."
node /Users/anton/Desktop/mcpintegrationwithdata/test-services.js

# Очікування в нескінченному циклі поки користувач не зупинить
while true; do
    sleep 10
done
