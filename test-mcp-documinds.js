/**
 * Тестування інтеграції з DocuMinds через MCP сервер
 * Використовуємо існуючий MCP сервер: crystaldba/postgres-mcp
 */

const axios = require('axios');

// Конфігурація DocuMinds Supabase
const DOCUMINDS_CONFIG = {
  url: 'https://rbmepcfznvcskxayuisp.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWVwY2Z6bnZjc2t4YXl1aXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjUzOTAsImV4cCI6MjA3NTAwMTM5MH0.ia2D4eT_VpqKApv4pdgTvHsvOCyR_XoCra73j2ElI9Y'
};

// MCP сервер (ваш існуючий PostgreSQL MCP)
const MCP_SERVER_URL = 'http://localhost:3002';

async function testDocuMindsConnection() {
  console.log('🔗 Тестування підключення до DocuMinds Supabase...');
  
  try {
    // Спочатку протестуємо MCP сервер
    console.log('\n📡 Перевірка MCP сервера...');
    try {
      const mcpResponse = await axios.get(MCP_SERVER_URL, { timeout: 5000 });
      console.log('✅ MCP сервер доступний');
      console.log(`   Статус: ${mcpResponse.data?.status || 'OK'}`);
    } catch (error) {
      console.log('⚠️  MCP сервер недоступний, використовуватиму пряме Supabase API');
    }

    // Тест прямого підключення до DocuMinds Supabase
    console.log('\n🏢 Тестування організацій в DocuMinds...');
    const orgResponse = await axios.get(`${DOCUMINDS_CONFIG.url}/rest/v1/organizations`, {
      headers: {
        'apikey': DOCUMINDS_CONFIG.anonKey,
        'Authorization': `Bearer ${DOCUMINDS_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        select: 'id,name,domain,plan,status',
        limit: 3
      }
    });

    if (orgResponse.data && orgResponse.data.length > 0) {
      console.log(`✅ Знайдено ${orgResponse.data.length} організацій:`);
      orgResponse.data.forEach(org => {
        console.log(`   - ${org.name} (${org.domain || 'No domain'}) - ${org.plan} - ${org.status}`);
      });
    } else {
      console.log('ℹ️  Організації не знайдені або таблиця порожня');
    }

    // Тест інтеграцій
    console.log('\n🔧 Тестування інтеграцій...');
    const integrationsResponse = await axios.get(`${DOCUMINDS_CONFIG.url}/rest/v1/integrations`, {
      headers: {
        'apikey': DOCUMINDS_CONFIG.anonKey,
        'Authorization': `Bearer ${DOCUMINDS_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        select: 'id,name,type,status,organization_id',
        limit: 5
      }
    });

    if (integrationsResponse.data && integrationsResponse.data.length > 0) {
      console.log(`✅ Знайдено ${integrationsResponse.data.length} інтеграцій:`);
      integrationsResponse.data.forEach(integration => {
        console.log(`   - ${integration.name} (${integration.type}) - ${integration.status}`);
      });
    } else {
      console.log('ℹ️  Інтеграції не знайдені або таблиця порожня');
    }

    // Тест ресурсів
    console.log('\n📄 Тестування ресурсів...');
    const resourcesResponse = await axios.get(`${DOCUMINDS_CONFIG.url}/rest/v1/resources`, {
      headers: {
        'apikey': DOCUMINDS_CONFIG.anonKey,
        'Authorization': `Bearer ${DOCUMINDS_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        select: 'id,name,type,url,integration_id',
        limit: 5
      }
    });

    if (resourcesResponse.data && resourcesResponse.data.length > 0) {
      console.log(`✅ Знайдено ${resourcesResponse.data.length} ресурсів:`);
      resourcesResponse.data.forEach(resource => {
        console.log(`   - ${resource.name} (${resource.type}) - ${resource.url || 'No URL'}`);
      });
    } else {
      console.log('ℹ️  Ресурси не знайдені або таблиця порожня');
    }

    console.log('\n🎉 Тестування DocuMinds завершено успішно!');
    console.log('\n📝 Наступні кроки:');
    console.log('   1. Інтегрувати наш OnboardAI з реальними організаціями');
    console.log('   2. Використовувати існуючі MCP сервери для зв\'язку');
    console.log('   3. Тестувати онбординг з реальними ресурсами');

    return true;

  } catch (error) {
    console.log(`❌ Тестування не пройшло: ${error.message}`);
    if (error.response) {
      console.log(`   Статус: ${error.response.status}`);
      console.log(`   Дані: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testOnboardingIntegration() {
  console.log('\n🚀 Тестування інтеграції онбордингу...');
  
  try {
    // Симулюємо створення плану онбордингу з real DocuMinds даними
    const employeeDomain = 'acme.com'; // Приклад домену

    // Шукаємо організацію за доменом
    const orgResponse = await axios.get(`${DOCUMINDS_CONFIG.url}/rest/v1/organizations`, {
      headers: {
        'apikey': DOCUMINDS_CONFIG.anonKey,
        'Authorization': `Bearer ${DOCUMINDS_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        domain: `eq.${employeeDomain}`,
        select: 'id,name,domain,plan'
      }
    });

    if (orgResponse.data && orgResponse.data.length > 0) {
      const org = orgResponse.data[0];
      console.log(`✅ Організація знайдена: ${org.name}`);

      // Отримуємо ресурси для онбордингу
      const resourcesResponse = await axios.get(`${DOCUMINDS_CONFIG.url}/rest/v1/resources`, {
        headers: {
          'apikey': DOCUMINDS_CONFIG.anonKey,
          'Authorization': `Bearer ${DOCUMINDS_CONFIG.anonKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          organization_id: `eq.${org.id}`,
          status: `eq.active`,
          select: 'id,name,type,url'
        }
      });

      if (resourcesResponse.data && resourcesResponse.data.length > 0) {
        console.log(`📚 Знайдено ${resourcesResponse.data.length} ресурсів для онбордингу:`);
        resourcesResponse.data.slice(0, 3).forEach(resource => {
          console.log(`   📖 ${resource.name} (${resource.type})`);
        });
      }

      return {
        organization: org,
        resources: resourcesResponse.data || [],
        onboardingReady: true
      };

    } else {
      console.log(`⚠️  Організацію з доменом ${employeeDomain} не знайдено`);
      return {
        organization: null,
        resources: [],
        onboardingReady: false
      };
    }

  } catch (error) {
    console.log(`❌ Помилка інтеграції онбордингу: ${error.message}`);
    return null;
  }
}

// Запуск тестів
async function main() {
  console.log('🧪 Комплексне тестування інтеграції OnboardAI + DocuMinds');
  console.log('=' .repeat(60));
  
  const connectionTest = await testDocuMindsConnection();
  
  if (connectionTest) {
    await testOnboardingIntegration();
  }
  
  console.log('\n✨ Тестування завершено!');
  console.log('\n💡 Для хакатону рекомендую:');
  console.log('   1. Використовувати ваш PostgreSQL MCP сервер для даних');
  console.log('   2. Інтегрувати з реальними DocuMinds організаціями');
  console.log('   3. Демонструвати персоналізований онбординг');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testDocuMindsConnection, testOnboardingIntegration };
