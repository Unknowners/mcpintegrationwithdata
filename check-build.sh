#!/bin/bash

echo "🔍 Перевірка готовності проекту до зборки..."

# Перевірка наявності необхідних файлів
echo "📁 Перевірка структури файлів..."
files=(
  "docker-compose.yml"
  "onboardai-api/Dockerfile"
  "onboardai-api/requirements.txt"
  "onboardai-api/main.py"
  "mcp-servers/mcp-jira/Dockerfile"
  "mcp-servers/mcp-jira/package.json"
  "mcp-servers/mcp-jira/index.js"
  "mcp-servers/mcp-notion/Dockerfile"
  "mcp-servers/mcp-notion/package.json"
  "mcp-servers/mcp-notion/index.js"
  "nginx/nginx.conf"
)

missing_files=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file відсутній"
    missing_files=$((missing_files + 1))
  fi
done

# Перевірка синтаксису Python файлу
echo ""
echo "🐍 Перевірка синтаксису Python..."
if python3 -m py_compile onboardai-api/main.py 2>/dev/null; then
  echo "✅ main.py синтаксично правильний"
else
  echo "❌ main.py має синтаксичні помилки"
  missing_files=$((missing_files + 1))
fi

# Перевірка синтаксису JavaScript файлів
echo ""
echo "🟨 Перевірка синтаксису JavaScript..."
if node -c mcp-servers/mcp-jira/index.js 2>/dev/null; then
  echo "✅ mcp-jira/index.js синтаксично правильний"
else
  echo "❌ mcp-jira/index.js має синтаксичні помилки"
  missing_files=$((missing_files + 1))
fi

if node -c mcp-servers/mcp-notion/index.js 2>/dev/null; then
  echo "✅ mcp-notion/index.js синтаксично правильний"
else
  echo "❌ mcp-notion/index.js має синтаксичні помилки"
  missing_files=$((missing_files + 1))
fi

# Перевірка Docker конфігурації
echo ""
echo "🐳 Перевірка Docker файлів..."
if docker-compose config > /dev/null 2>&1; then
  echo "✅ docker-compose.yml конфігурація правильна"
else
  echo "❌ docker-compose.yml має помилки"
  missing_files=$((missing_files + 1))
fi

# Перевірка портпів
echo ""
echo "🔌 Перевірка портів..."
ports=(8000 3001 3002 6379 80)
for port in "${ports[@]}"; do
  if lsof -i:$port >/dev/null 2>&1; then
    echo "⚠️  Порт $port зайнятий - можливі конфлікти"
  else
    echo "✅ Порт $port вільний"
  fi
done

# Перевірка пакетних файлів
echo ""
echo "📦 Перевірка пакетних залежностей..."
if [ -f "onboardai-api/requirements.txt" ] && grep -q "fastapi" onboardai-api/requirements.txt; then
  echo "✅ FastAPI в requirements.txt"
else
  echo "❌ FastAPI відсутній в requirements.txt"
  missing_files=$((missing_files + 1))
fi

if [ -f "mcp-servers/mcp-jira/package.json" ] && grep -q "express" mcp-servers/mcp-jira/package.json; then
  echo "✅ Express в mcp-jira package.json"
else
  echo "❌ Express відсутній в mcp-jira package.json"
  missing_files=$((missing_files + 1))
fi

# Підсумок
echo ""
echo "📊 ПІДСУМОК ПЕРЕВІРКИ:"
echo "===================="
if [ $missing_files -eq 0 ]; then
  echo "🎉 Всі перевірки пройшли! Проект готовий до збирання."
  echo ""
  echo "Для запуску використовуйте:"
  echo "  ./start.sh"
  echo "  або"
  echo "  make demo"
  exit 0
else
  echo "⚠️  Знайдено $missing_files проблем. Виправте їх перед запуском."
  echo ""
  echo "Для запуску після виправлень:"
  echo "  ./start.sh"
  exit 1
fi
