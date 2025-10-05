#!/usr/bin/env node
/**
 * Тестування OnboardAI платформи на live домені
 */

const axios = require('axios');

class OnboardAITester {
  constructor() {
    this.baseUrl = 'https://ai-hack-mcpetc-gcbplx-d53e53-157-180-26-155.traefik.me';
    this.timeout = 10000; // 10 секунд
  }

  async testEndpoint(path, method = 'GET', data = null) {
    try {
      console.log(`🔍 Тестування: ${method} ${path}`);
      
      const config = {
        method,
        url: `${this.baseUrl}${path}`,
        timeout: this.timeout,
        validateStatus: () => true, // Приймаємо будь-який статус
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false // Ігноруємо SSL помилки
        })
      };

      if (data) {
        config.data = data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      
      console.log(`   📊 Статус: ${response.status}`);
      console.log(`   📝 Відповідь: ${response.data ? JSON.stringify(response.data).substring(0, 100) + '...' : 'Empty'}`);
      
      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.log(`   ❌ Помилка: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testAllEndpoints() {
    console.log("🌐 Тестування OnboardAI платформи на live домені");
    console.log(`🔗 Домен: ${this.baseUrl}`);
    console.log("=" * 60);

    const endpoints = [
      // Основні ендпоінти
      { path: '/', method: 'GET' },
      { path: '/health', method: 'GET' },
      { path: '/docs', method: 'GET' },
      { path: '/redoc', method: 'GET' },
      { path: '/openapi.json', method: 'GET' },
      
      // API ендпоінти
      { path: '/api/v1/onboarding/create', method: 'POST', data: {
        name: "Test User",
        email: "test@techcorp.com",
        role: "Frontend Developer",
        department: "Engineering",
        start_date: "2024-02-01",
        manager_email: "manager@techcorp.com",
        skills_required: ["React", "TypeScript"],
        resources_needed: ["Development Environment"]
      }},
      { path: '/api/v1/documinds/resources?organization_domain=techcorp.com', method: 'GET' },
      { path: '/api/v1/documinds/integrations?organization_domain=techcorp.com', method: 'GET' },
      { path: '/api/v1/qa/answer?question=test&role=Frontend Developer', method: 'GET' },
      { path: '/api/v1/progress/test-employee-id', method: 'GET' },
      { path: '/api/v1/vectorization/status', method: 'GET' },
      { path: '/api/v1/ai/knowledge-summary?organization_domain=techcorp.com', method: 'GET' },
      
      // MCP сервери (якщо доступні)
      { path: '/mcp/supabase/health', method: 'GET' },
      { path: '/mcp/jira/health', method: 'GET' },
      { path: '/mcp/notion/health', method: 'GET' }
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(endpoint.path, endpoint.method, endpoint.data);
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        ...result
      });
      console.log(''); // Пустий рядок для читабельності
    }

    // Підсумок
    console.log("\n📊 Підсумок тестування:");
    console.log("=" * 30);
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`✅ Успішних: ${successful}/${total}`);
    console.log(`❌ Невдалих: ${total - successful}/${total}`);
    
    console.log("\n🎯 Успішні ендпоінти:");
    results.filter(r => r.success).forEach(r => {
      console.log(`   ✅ ${r.method} ${r.endpoint} (${r.status})`);
    });
    
    console.log("\n❌ Невдалі ендпоінти:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ❌ ${r.method} ${r.endpoint} (${r.status || 'Error'})`);
    });

    // Рекомендації
    console.log("\n💡 Рекомендації:");
    if (successful === 0) {
      console.log("🚨 Сервіс не запущений або недоступний");
      console.log("   - Перевірте чи запущений Docker контейнер");
      console.log("   - Перевірте налаштування Traefik");
      console.log("   - Перевірте логи сервісу");
    } else if (successful < total / 2) {
      console.log("⚠️ Частково працює");
      console.log("   - Деякі ендпоінти недоступні");
      console.log("   - Перевірте конфігурацію сервісів");
    } else {
      console.log("🎉 Більшість сервісів працює!");
      console.log("   - Платформа готова для демонстрації");
    }

    return results;
  }

  async testSpecificService(serviceName) {
    console.log(`🔍 Тестування конкретного сервісу: ${serviceName}`);
    console.log("=" * 40);

    const serviceEndpoints = {
      'onboardai-api': [
        { path: '/health', method: 'GET' },
        { path: '/docs', method: 'GET' },
        { path: '/api/v1/onboarding/create', method: 'POST' }
      ],
      'supabase-mcp': [
        { path: '/mcp/supabase/health', method: 'GET' },
        { path: '/mcp/supabase/api/organizations', method: 'GET' }
      ],
      'jira-mcp': [
        { path: '/mcp/jira/health', method: 'GET' },
        { path: '/mcp/jira/api/onboarding-tasks', method: 'GET' }
      ],
      'notion-mcp': [
        { path: '/mcp/notion/health', method: 'GET' },
        { path: '/mcp/notion/api/onboarding-resources', method: 'GET' }
      ]
    };

    const endpoints = serviceEndpoints[serviceName] || [];
    
    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint.path, endpoint.method, endpoint.data);
      console.log('');
    }
  }
}

// Запуск тестування
if (require.main === module) {
  const tester = new OnboardAITester();
  
  const args = process.argv.slice(2);
  if (args.length > 0) {
    // Тестування конкретного сервісу
    tester.testSpecificService(args[0]).catch(console.error);
  } else {
    // Тестування всіх ендпоінтів
    tester.testAllEndpoints().catch(console.error);
  }
}

module.exports = OnboardAITester;
