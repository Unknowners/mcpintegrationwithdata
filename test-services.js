/**
 * Тестування всіх сервісів OnboardAI
 * Перевіряє чи правильно працюють всі MCP сервери та основний API
 */

const axios = require('axios');
const colors = require('colors/safe');

const SERVICES = {
  onboardai_api: 'http://localhost:8000',
  mcp_jira: 'http://localhost:3001',
  mcp_notion: 'http://localhost:3022'
};

async function testService(name, baseUrl, endpoints = []) {
  console.log(colors.blue(`\n🔍 Тестування ${name}...`));
  
  try {
    // Тест основного endpoint
    const response = await axios.get(`${baseUrl}/`, { timeout: 5000 });
    console.log(colors.green(`✅ ${name} відповідає на ${baseUrl}/`));
    console.log(`   Статус: ${response.data.status || 'OK'}`);
    
    // Тест health endpoint
    try {
      const healthResponse = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
      console.log(colors.green(`✅ Health check пройшов успішно`));
      console.log(`   Статус: ${JSON.stringify(healthResponse.data.status)}`);
    } catch (healthError) {
      console.log(colors.yellow(`⚠️  Health check недоступний (це може бути нормально)`));
    }
    
    // Тест додаткових endpoints
    for (const endpoint of endpoints) {
      try {
        await axios.get(`${baseUrl}${endpoint}`, { timeout: 5000 });
        console.log(colors.green(`✅ Endpoint ${endpoint} працює`));
      } catch (endpointError) {
        console.log(colors.yellow(`⚠️  Endpoint ${endpoint} недоступний`));
      }
    }
    
    return true;
  } catch (error) {
    console.log(colors.red(`❌ ${name} недоступний на ${baseUrl}`));
    console.log(`   Помилка: ${error.message}`);
    return false;
  }
}

async function testIntegration(apiBaseUrl, mcpBaseUrls) {
  console.log(colors.blue(`\n🔗 Тестування інтеграції між сервісами...`));
  
  try {
    // Тест створення онбордингу через основний API
    const onboardingData = {
      name: "Test User",
      email: "test@company.com", 
      role: "Frontend Developer",
      department: "Engineering",
      start_date: "2024-01-15",
      manager_email: "manager@company.com",
      skills_required: ["React", "JavaScript"],
      resources_needed: ["Laptop"]
    };
    
    const response = await axios.post(`${apiBaseUrl}/api/v1/onboarding/create`, onboardingData, { 
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(colors.green(`✅ Основний API створює онбординг правильно`));
    console.log(`   Employee ID: ${response.data.employee_id}`);
    console.log(`   Завдано виконалось: ${response.data.tasks.length}`);
    console.log(`   Ресурсів отримано: ${response.data.resources.length}`);
    
    // Тест взаємодії з MCP серверами
    if (mcpBaseUrls.jira) {
      try {
        const jiraResponse = await axios.get(`${mcpBaseUrls.jira}/api/jira/projects`, { timeout: 5000 });
        console.log(colors.green(`✅ Jira MCP повертає дані прогретів`));
      } catch (error) {
        console.log(colors.yellow(`⚠️  Jira MCP інтеграція не працює (нормально без API ключів)`));
      }
    }
    
    if (mcpBaseUrls.notion) {
      try {
        const notionResponse = await axios.get(`${mcpBaseUrls.notion}/api/resources/role/Frontend%20Developer`, { timeout: 5000 });
        console.log(colors.green(`✅ Notion MCP повертає ресурси`));
        console.log(`   Ресурсів знайдено: ${notionResponse.data.resources.length}`);
      } catch (error) {
        console.log(colors.yellow(`⚠️  Notion MCP інтеграція не працює`));
      }
    }
    
    return true;
  } catch (error) {
    console.log(colors.red(`❌ Інтеграція не працює: ${error.message}`));
    return false;
  }
}

async function main() {
  console.log(colors.cyan('🚀 Початок тестування OnboardAI сервісів...\n'));
  
  const results = {};
  
  // Тестування кожного сервісу
  results.onboardai_api = await testService('OnboardAI API', SERVICES.onboardai_api, ['/docs']);
  results.mcp_jira = await testService('Jira MCP Server', SERVICES.mcp_jira, ['/api/jira/projects']);
  results.mcp_notion = await testService('Notion MCP Server', SERVICES.mcp_notion, ['/api/resources/role/Frontend%20Developer']);
  
  // Тестування інтеграції
  results.integration = await testIntegration(SERVICES.onboardai_api, {
    jira: SERVICES.mcp_jira,
    notion: SERVICES.mcp_notion
  });
  
  // Підсумок
  console.log(colors.cyan('\n📊 ПІДСУМОК ТЕСТУВАННЯ:'));
  console.log('='.repeat(50));
  
  const services = Object.keys(results).filter(key => !key.includes('integration'));
  const serviceResults = results.integration ? 
    services.map(s => `${s}: ${results[s] ? '✅' : '❌'}`).join(', ') : 
    'Інтеграція не працює';
  
  console.log(colors.green(`Сервіси працюють: ${serviceResults}`));
  console.log(colors.green(`Інтеграція: ${results.integration ? '✅ Працює' : '❌ Не працює'}`));
  
  const allWorking = Object.values(results).every(result => result === true);
  
  if (allWorking) {
    console.log(colors.green('\n🎉 ВСІ ТЕСТИ ПРОЙШЛИ УСПІШНО!'));
    console.log(colors.yellow('📱 API документування доступна на: http://localhost:8000/docs'));
    console.log(colors.yellow('🔧 Jira MCP працює на: http://localhost:3001'));
    console.log(colors.yellow('📝 Notion MCP працює на: http://localhost:3002'));
  } else {
    console.log(colors.red('\n⚠️  СЕРВІСИ ПРАЦЮЮТЬ ЧАСТКОВО'));
    console.log(colors.yellow('Перевірте логи: docker-compose logs'));
    console.log(colors.yellow('Перезапустіть: docker-compose restart'));
  }
  
  process.exit(allWorking ? 0 : 1);
}

// Запуск тестування
if (require.main === module) {
  main().catch(error => {
    console.log(colors.red(`Критична помилка: ${error.message}`));
    process.exit(1);
  });
}

module.exports = { testService, testIntegration };
