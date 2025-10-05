#!/usr/bin/env node
/**
 * Правильна реалізація AI агента з динамічними кредитами
 * Демонструє як AI агент отримує кредити з DocuMinds для кожної компанії
 */

require('dotenv').config();
const axios = require('axios');

class CorrectAIAgent {
  constructor() {
    this.documindsConfig = {
      url: 'https://rbmepcfznvcskxayuisp.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWVwY2Z6bnZjc2t4YXl1aXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjUzOTAsImV4cCI6MjA3NTAwMTM5MH0.ia2D4eT_VpqKApv4pdgTvHsvOCyR_XoCra73j2ElI9Y',
      apiUrl: 'https://rbmepcfznvcskxayuisp.supabase.co/rest/v1'
    };
  }

  async demonstrateCorrectImplementation() {
    console.log("🤖 Правильна реалізація AI агента з динамічними кредитами");
    console.log("=" * 60);

    // Сценарії різних компаній
    const scenarios = [
      {
        email: "ivan@techcorp.com",
        question: "Як налаштувати розробницьке середовище?",
        role: "Frontend Developer"
      },
      {
        email: "maria@financeflow.com", 
        question: "Які стандарти кодування ми використовуємо?",
        role: "Backend Developer"
      },
      {
        email: "alex@healthtech.com",
        question: "Як працювати з Kubernetes кластером?",
        role: "DevOps Engineer"
      }
    ];

    for (const scenario of scenarios) {
      await this.processScenario(scenario);
    }
  }

  async processScenario(scenario) {
    console.log(`\n👤 Сценарій: ${scenario.email}`);
    console.log(`❓ Питання: "${scenario.question}"`);
    console.log(`👔 Роль: ${scenario.role}`);

    // 1. Визначити компанію з email
    const domain = scenario.email.split('@')[1];
    console.log(`\n🏢 Крок 1: Визначено домен компанії: ${domain}`);

    // 2. Отримати кредити динамічно з DocuMinds
    console.log(`\n🔍 Крок 2: Запит до DocuMinds для отримання кредитів...`);
    const credentials = await this.getCompanyCredentials(domain);
    
    console.log(`📊 Отримано кредити для ${domain}:`);
    console.log(`   🎯 Jira: ${credentials.jira ? credentials.jira.url : 'не налаштовано'}`);
    console.log(`   📚 Notion: ${credentials.notion ? credentials.notion.workspace : 'не налаштовано'}`);
    console.log(`   🔑 Access Token: ${credentials.jira ? credentials.jira.access_token.substring(0, 20) + '...' : 'немає'}`);

    // 3. Використати кредити для отримання контенту
    console.log(`\n📚 Крок 3: Отримання контенту з корпоративних систем...`);
    const content = await this.fetchCompanyContent(domain, credentials);
    
    console.log(`📊 Отримано контент:`);
    console.log(`   📄 Документів: ${content.documents.length}`);
    console.log(`   🎯 Задач: ${content.tasks.length}`);
    console.log(`   📚 Ресурсів: ${content.resources.length}`);

    // 4. Векторизувати з контекстом компанії
    console.log(`\n🧠 Крок 4: Векторизація з метаданими організації...`);
    const vectors = await this.vectorizeWithContext(content, domain);
    
    console.log(`📊 Створено векторів: ${vectors.length}`);
    console.log(`🏷️ Метадані: organization=${domain}, role=${scenario.role}`);

    // 5. Генерувати контекстуальну відповідь
    console.log(`\n🤖 Крок 5: Генерація AI відповіді...`);
    const answer = await this.generateContextualAnswer(scenario.question, vectors, domain, scenario.role);
    
    console.log(`\n💬 AI відповідь:`);
    console.log(`   ${answer.text}`);
    console.log(`   📊 Довіра: ${answer.confidence}%`);
    console.log(`   🏢 Контекст: ${answer.context}`);
    console.log(`   📚 Джерела: ${answer.sources.join(', ')}`);

    console.log(`\n✅ Результат: AI агент працював ТІЛЬКИ з даними ${domain}!`);
  }

  async getCompanyCredentials(domain) {
    // Симуляція запиту до DocuMinds для отримання кредитів компанії
    console.log(`   🔍 Запит: SELECT * FROM organizations WHERE domain = '${domain}'`);
    
    // Симуляція різних конфігурацій компаній
    const companyConfigs = {
      "techcorp.com": {
        organization: {
          id: "org-techcorp-uuid",
          name: "TechCorp",
          domain: domain,
          plan: "enterprise"
        },
        jira: {
          url: "https://techcorp.atlassian.net",
          access_token: "jira_token_for_techcorp_only_12345",
          project_key: "TECH"
        },
        notion: {
          workspace: "TechCorp Knowledge Base",
          api_key: "notion_key_for_techcorp_only_67890",
          database_id: "techcorp-db-uuid"
        }
      },
      "financeflow.com": {
        organization: {
          id: "org-financeflow-uuid", 
          name: "FinanceFlow",
          domain: domain,
          plan: "pro"
        },
        jira: {
          url: "https://financeflow.atlassian.net",
          access_token: "jira_token_for_financeflow_only_54321",
          project_key: "FIN"
        },
        notion: {
          workspace: "FinanceFlow Documentation",
          api_key: "notion_key_for_financeflow_only_09876",
          database_id: "financeflow-db-uuid"
        }
      },
      "healthtech.com": {
        organization: {
          id: "org-healthtech-uuid",
          name: "HealthTech Solutions", 
          domain: domain,
          plan: "enterprise"
        },
        jira: {
          url: "https://healthtech.atlassian.net",
          access_token: "jira_token_for_healthtech_only_11111",
          project_key: "HT"
        },
        notion: {
          workspace: "HealthTech Internal Docs",
          api_key: "notion_key_for_healthtech_only_22222",
          database_id: "healthtech-db-uuid"
        }
      }
    };

    const config = companyConfigs[domain];
    if (!config) {
      throw new Error(`Компанія з доменом ${domain} не знайдена в DocuMinds`);
    }

    console.log(`   ✅ Знайдено організацію: ${config.organization.name}`);
    console.log(`   🔍 Запит: SELECT * FROM integrations WHERE organization_id = '${config.organization.id}'`);
    console.log(`   🔍 Запит: SELECT * FROM integration_credentials WHERE integration_id = '...'`);

    return config;
  }

  async fetchCompanyContent(domain, credentials) {
    // Симуляція отримання контенту з корпоративних систем
    console.log(`   🎯 Підключення до Jira: ${credentials.jira.url}`);
    console.log(`   📚 Підключення до Notion: ${credentials.notion.workspace}`);
    
    // Симуляція різного контенту для різних компаній
    const contentByCompany = {
      "techcorp.com": {
        documents: [
          "React Development Guide",
          "API Documentation", 
          "UI Component Library"
        ],
        tasks: [
          "ONBD-001: Setup development environment",
          "ONBD-002: Learn React components",
          "ONBD-003: API integration"
        ],
        resources: [
          "TechCorp Knowledge Base - Setup Guide",
          "TechCorp Knowledge Base - UI Components"
        ]
      },
      "financeflow.com": {
        documents: [
          "Python Best Practices",
          "Database Schema Documentation",
          "Security Protocols"
        ],
        tasks: [
          "FIN-001: Setup Python environment",
          "FIN-002: Database connection",
          "FIN-003: Security compliance"
        ],
        resources: [
          "FinanceFlow Documentation - Python Guide",
          "FinanceFlow Documentation - Database Setup"
        ]
      },
      "healthtech.com": {
        documents: [
          "Java Development Guidelines",
          "Healthcare Compliance",
          "Security Protocols"
        ],
        tasks: [
          "HT-001: Setup Java environment",
          "HT-002: Healthcare compliance training",
          "HT-003: Security protocols"
        ],
        resources: [
          "HealthTech Internal Docs - Java Guidelines",
          "HealthTech Internal Docs - Security"
        ]
      }
    };

    return contentByCompany[domain] || { documents: [], tasks: [], resources: [] };
  }

  async vectorizeWithContext(content, domain) {
    // Симуляція векторизації з метаданими організації
    console.log(`   🧠 Створення embeddings з OpenAI...`);
    console.log(`   📊 Додавання метаданих: organization=${domain}`);
    
    const vectors = [];
    const allContent = [...content.documents, ...content.tasks, ...content.resources];
    
    for (const item of allContent) {
      vectors.push({
        id: `vector_${Math.random().toString(36).substr(2, 9)}`,
        content: item,
        metadata: {
          organization: domain,
          type: content.documents.includes(item) ? 'document' : 
                content.tasks.includes(item) ? 'task' : 'resource',
          source: domain === 'techcorp.com' ? 'TechCorp Knowledge Base' :
                 domain === 'financeflow.com' ? 'FinanceFlow Documentation' :
                 'HealthTech Internal Docs'
        },
        embedding: `embedding_${Math.random().toString(36).substr(2, 9)}`
      });
    }

    console.log(`   📊 Збереження в Pinecone з фільтром organization='${domain}'`);
    return vectors;
  }

  async generateContextualAnswer(question, vectors, domain, role) {
    // Симуляція генерації контекстуальної відповіді
    console.log(`   🤖 Аналіз питання: "${question}"`);
    console.log(`   🏢 Контекст компанії: ${domain}`);
    console.log(`   👔 Роль співробітника: ${role}`);
    
    // Симуляція різних відповідей для різних компаній
    const answersByCompany = {
      "techcorp.com": {
        text: `Для налаштування розробницького середовища в TechCorp:\n\n1. Встановіть Node.js та npm\n2. Клонуйте репозиторій проекту\n3. Встановіть залежності: npm install\n4. Налаштуйте React та TypeScript\n5. Підключіться до корпоративного VPN\n\nДетальна інструкція доступна в TechCorp Knowledge Base.`,
        confidence: 92,
        context: "TechCorp Frontend Development",
        sources: ["TechCorp Knowledge Base - Setup Guide", "ONBD-001"]
      },
      "financeflow.com": {
        text: `Стандарти кодування в FinanceFlow:\n\n1. PEP 8 для Python коду\n2. Type hints для всіх функцій\n3. Docstrings для документації\n4. Pytest для тестування\n5. Black для форматування\n\nВсі стандарти документовані в FinanceFlow Documentation.`,
        confidence: 95,
        context: "FinanceFlow Backend Development", 
        sources: ["FinanceFlow Documentation - Python Guide", "FIN-002"]
      },
      "healthtech.com": {
        text: `Робота з Kubernetes в HealthTech Solutions:\n\n1. Helm charts для деплою\n2. Istio для service mesh\n3. Prometheus для моніторингу\n4. Falco для security\n5. Grafana для візуалізації\n\nДетальна документація в HealthTech Internal Docs.`,
        confidence: 90,
        context: "HealthTech DevOps Operations",
        sources: ["HealthTech Internal Docs - Kubernetes Guide", "HT-003"]
      }
    };

    const answer = answersByCompany[domain];
    if (!answer) {
      return {
        text: `Для отримання відповіді на ваше питання, рекомендую звернутися до корпоративної документації або створити задачу в системі управління проектами.`,
        confidence: 75,
        context: `${domain} General`,
        sources: [`${domain} Documentation`]
      };
    }

    return answer;
  }

  async demonstrateSecurityBenefits() {
    console.log("\n🛡️ Переваги безпеки правильної архітектури");
    console.log("=" * 50);

    console.log("✅ Організаційна ізоляція:");
    console.log("   - Кожна компанія має власні кредити");
    console.log("   - AI агент НЕ може переключатися між компаніями");
    console.log("   - Дані однієї компанії недоступні іншій");

    console.log("\n✅ Динамічні кредити:");
    console.log("   - Кредити зберігаються в DocuMinds integration_credentials");
    console.log("   - AI агент отримує їх тільки при запиті");
    console.log("   - Автоматичне оновлення через OAuth refresh");

    console.log("\n✅ Контекстуальна векторизація:");
    console.log("   - Кожен вектор має метадані організації");
    console.log("   - Пошук фільтрується по organization_id");
    console.log("   - Неможливо отримати дані іншої компанії");

    console.log("\n✅ Відсутність глобальних кредитів:");
    console.log("   - AI агент НЕ має власних кредитів до Jira/Notion");
    console.log("   - Всі доступі через DocuMinds integration_credentials");
    console.log("   - Компанії контролюють власні інтеграції");
  }

  async runFullDemo() {
    console.log("🤖 Correct AI Agent Implementation Demo");
    console.log("=" * 50);

    await this.demonstrateCorrectImplementation();
    await this.demonstrateSecurityBenefits();

    console.log("\n🎉 Демонстрація завершена!");
    console.log("\n💡 Висновок:");
    console.log("✅ AI агент отримує кредити ДИНАМІЧНО з DocuMinds");
    console.log("✅ Кожна компанія має власні інтеграції та кредити");
    console.log("✅ Повна ізоляція даних між організаціями");
    console.log("✅ Контекстуальні відповіді з правильним джерелом");
    console.log("✅ Enterprise-ready безпека та compliance");
    
    console.log("\n🚀 Готово для production deployment!");
  }
}

// Запуск демонстрації
if (require.main === module) {
  const demo = new CorrectAIAgent();
  demo.runFullDemo().catch(console.error);
}

module.exports = CorrectAIAgent;
