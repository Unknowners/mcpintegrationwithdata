#!/bin/bash

echo "🚀 Starting OnboardAI hackathon project..."

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Перевіряємо чи існує .env файл
if [ ! -f .env ]; then
    echo -e "${RED}⚠️  .env file not found. Please copy env.example to .env and configure your settings.${NC}"
    echo -e "${YELLOW}   cp env.example .env${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Checking project dependencies...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are available${NC}"

echo -e "${BLUE}🔨 Step 2: Building all Docker images...${NC}"
echo "   📦 Building OnboardAI API..."
docker-compose build onboardai-api

echo "   📦 Building Jira MCP Server..."
docker-compose build mcp-jira

echo "   📦 Building Notion MCP Server..."
docker-compose build mcp-notion

echo "   📦 Building Supabase MCP Server..."
docker-compose build mcp-supabase

echo -e "${GREEN}✅ All Docker images built successfully${NC}"

echo -e "${BLUE}🐳 Step 3: Starting all services...${NC}"
docker-compose up -d

echo -e "${BLUE}⏳ Step 4: Waiting for services to initialize...${NC}"
sleep 15

echo -e "${BLUE}🔍 Step 5: Checking service health...${NC}"
# Перевіряємо статус кожного сервісу
services=("onboardai-api:8000" "mcp-jira:3001" "mcp-notion:3022" "mcp-supabase:3033")
for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    # Чекаємо поки сервіс відповість
    timeout=30
    while [ $timeout -gt 0 ]; do
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is healthy${NC}"
            break
        fi
        echo -e "${YELLOW}⏳ Waiting for $name to start...${NC}"
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        echo -e "${RED}❌ $name failed to start within 30 seconds${NC}"
    fi
done

echo ""
echo -e "${BLUE}📊 Step 6: Service status overview:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}🎉 OnboardAI platform is ready!${NC}"
echo ""
echo -e "${BLUE}🌐 Main API:${NC}        http://localhost:8000"
echo -e "${BLUE}📖 API Documentation:${NC} http://localhost:8000/docs"
echo -e "${BLUE}🔧 Interactive API:${NC}   http://localhost:8000/redoc"
echo ""
echo -e "${BLUE}🔗 MCP Servers:${NC}"
echo -e "   🎯 Jira MCP:      http://localhost:3001"
echo -e "   📝 Notion MCP:    http://localhost:3022"
echo -e "   🗄️  Supabase MCP:   http://localhost:3033"
echo ""
echo -e "${BLUE}🛠️  Management commands:${NC}"
echo "   📝 View logs:     docker-compose logs -f"
echo "   📝 Service logs:  docker-compose logs -f [service-name]"
echo "   🔄 Restart:       docker-compose restart"
echo "   🛑 Stop:          docker-compose down"
echo "   🧹 Clean up:      docker-compose down -v"