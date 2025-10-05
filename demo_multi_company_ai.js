#!/usr/bin/env node
/**
 * Демонстрація роботи AI агента з різними Jira та Notion системами
 * Показує як OnboardAI може працювати з множинними компаніями
 */

require('dotenv').config();
const axios = require('axios');

class MultiCompanyAIDemo {
  constructor() {
    this.apiBaseUrl = 'http://localhost:8000';
    this.jiraMCP = 'http://localhost:3001';
    this.notionMCP = 'http://localhost:3022';
    this.supabaseMCP = 'http://localhost:3033';
  }

  async demonstrateMultiCompanySupport() {
    console.log("🌍 Демонстрація роботи AI агента з різними компаніями");
    console.log("=" * 60);

    // Сценарії різних компаній
    const companies = [
      {
        name: "TechCorp",
        domain: "techcorp.com",
        jiraUrl: "https://techcorp.atlassian.net",
        notionWorkspace: "TechCorp Knowledge Base",
        industry: "Software Development",
        techStack: ["React", "Node.js", "AWS", "Docker"]
      },
      {
        name: "FinanceFlow", 
        domain: "financeflow.com",
        jiraUrl: "https://financeflow.atlassian.net",
        notionWorkspace: "FinanceFlow Documentation",
        industry: "FinTech",
        techStack: ["Python", "PostgreSQL", "Kubernetes", "Redis"]
      },
      {
        name: "HealthTech Solutions",
        domain: "healthtech.com", 
        jiraUrl: "https://healthtech.atlassian.net",
        notionWorkspace: "HealthTech Internal Docs",
        industry: "Healthcare Technology",
        techStack: ["Java", "Spring Boot", "MongoDB", "Azure"]
      }
    ];

    for (const company of companies) {
      await this.demonstrateCompanyIntegration(company);
    }
  }

  async demonstrateCompanyIntegration(company) {
    console.log(`\n🏢 Компанія: ${company.name} (${company.domain})`);
    console.log(`🏭 Індустрія: ${company.industry}`);
    console.log(`💻 Технічний стек: ${company.techStack.join(', ')}`);
    
    console.log(`\n🔗 Інтеграції:`);
    console.log(`   🎯 Jira: ${company.jiraUrl}`);
    console.log(`   📚 Notion: ${company.notionWorkspace}`);

    // Демонстрація роботи з різними ролями в цій компанії
    const roles = [
      { role: "Frontend Developer", questions: [
        "Як налаштувати розробницьке середовище?",
        "Які компоненти є в нашій UI бібліотеці?",
        "Як працювати з API в нашій архітектурі?"
      ]},
      { role: "Backend Developer", questions: [
        "Як підключитися до бази даних?",
        "Які стандарти кодування ми використовуємо?",
        "Як деплоїти сервіси в production?"
      ]},
      { role: "DevOps Engineer", questions: [
        "Як налаштувати CI/CD пайплайн?",
        "Які інструменти моніторингу ми використовуємо?",
        "Як працювати з Kubernetes кластером?"
      ]}
    ];

    for (const roleData of roles) {
      await this.demonstrateRoleSpecificAI(company, roleData);
    }
  }

  async demonstrateRoleSpecificAI(company, roleData) {
    console.log(`\n👤 Роль: ${roleData.role} в ${company.name}`);
    
    for (const question of roleData.questions) {
      console.log(`\n❓ Питання: "${question}"`);
      
      // Симуляція AI відповіді з урахуванням компанії та ролі
      const aiResponse = await this.simulateAIResponse(company, roleData.role, question);
      
      console.log(`🤖 AI відповідь:`);
      console.log(`   ${aiResponse.answer}`);
      console.log(`   📊 Довіра: ${aiResponse.confidence}%`);
      console.log(`   📚 Джерела: ${aiResponse.sources.join(', ')}`);
    }
  }

  async simulateAIResponse(company, role, question) {
    // Симуляція контекстуальної відповіді AI агента
    const responses = {
      "Frontend Developer": {
        "Як налаштувати розробницьке середовище?": {
          answer: `Для налаштування розробницького середовища в ${company.name}:\n\n1. Встановіть Node.js та npm\n2. Клонуйте репозиторій проекту\n3. Встановіть залежності: npm install\n4. Налаштуйте ${company.techStack[0]} та ${company.techStack[1]}\n5. Підключіться до корпоративного VPN\n\nДетальна інструкція доступна в ${company.notionWorkspace}`,
          confidence: 92,
          sources: [`${company.notionWorkspace} - Setup Guide`, `${company.jiraUrl} - ONBD-001`]
        },
        "Які компоненти є в нашій UI бібліотеці?": {
          answer: `В ${company.name} ми використовуємо власну UI бібліотеку з компонентами:\n\n- Button, Input, Modal, Table\n- DataGrid для таблиць даних\n- Charts для візуалізації\n- Form компоненти з валідацією\n\nВсі компоненти документовані в ${company.notionWorkspace} з прикладами використання.`,
          confidence: 88,
          sources: [`${company.notionWorkspace} - UI Components`, `${company.jiraUrl} - UI-001`]
        }
      },
      "Backend Developer": {
        "Як підключитися до бази даних?": {
          answer: `Підключення до бази даних в ${company.name}:\n\n1. Отримайте DATABASE_URL з environment variables\n2. Використовуйте ${company.techStack[1]} для підключення\n3. Налаштуйте connection pool\n4. Перевірте права доступу через корпоративний VPN\n\nКонфігурація детально описана в ${company.notionWorkspace}.`,
          confidence: 95,
          sources: [`${company.notionWorkspace} - Database Setup`, `${company.jiraUrl} - DB-001`]
        }
      },
      "DevOps Engineer": {
        "Як налаштувати CI/CD пайплайн?": {
          answer: `CI/CD пайплайн в ${company.name} налаштований через:\n\n1. ${company.techStack[2]} для хмарної інфраструктури\n2. ${company.techStack[3]} для контейнеризації\n3. GitHub Actions для автоматизації\n4. Моніторинг через Prometheus/Grafana\n\nДетальна документація в ${company.notionWorkspace}.`,
          confidence: 90,
          sources: [`${company.notionWorkspace} - DevOps Guide`, `${company.jiraUrl} - DEVOPS-001`]
        }
      }
    };

    const roleResponses = responses[role] || {};
    const specificResponse = roleResponses[question];
    
    if (specificResponse) {
      return specificResponse;
    }

    // Загальна відповідь якщо немає специфічної
    return {
      answer: `Для ${role} в ${company.name} рекомендую звернутися до ${company.notionWorkspace} або створити задачу в ${company.jiraUrl} для отримання детальної інформації.`,
      confidence: 75,
      sources: [`${company.notionWorkspace}`, `${company.jiraUrl}`]
    };
  }

  async demonstrateCrossCompanyKnowledge() {
    console.log("\n🧠 Демонстрація кросс-компанійних знань AI агента");
    console.log("=" * 50);

    const crossCompanyQuestions = [
      {
        question: "Які найкращі практики для React розробки?",
        context: "Порівняння підходів між TechCorp та FinanceFlow"
      },
      {
        question: "Як налаштувати Kubernetes для мікросервісів?",
        context: "Досвід HealthTech Solutions та TechCorp"
      },
      {
        question: "Які інструменти моніторингу найкраще використовувати?",
        context: "Аналіз рішень всіх трьох компаній"
      }
    ];

    for (const qa of crossCompanyQuestions) {
      console.log(`\n❓ Питання: "${qa.question}"`);
      console.log(`🎯 Контекст: ${qa.context}`);
      
      const crossResponse = await this.simulateCrossCompanyResponse(qa.question);
      
      console.log(`🤖 AI відповідь (з кросс-компанійним аналізом):`);
      console.log(`   ${crossResponse.answer}`);
      console.log(`   📊 Довіра: ${crossResponse.confidence}%`);
      console.log(`   🏢 Джерела: ${crossResponse.companies.join(', ')}`);
    }
  }

  async simulateCrossCompanyResponse(question) {
    // Симуляція відповіді з аналізом різних компаній
    const responses = {
      "Які найкращі практики для React розробки?": {
        answer: `На основі аналізу TechCorp та FinanceFlow:\n\nTechCorp використовує:\n- Functional components з хуками\n- TypeScript для типізації\n- Storybook для компонентів\n\nFinanceFlow додає:\n- Redux Toolkit для стану\n- React Query для API\n- Jest + Testing Library\n\nРекомендація: комбінувати підходи обох компаній.`,
        confidence: 89,
        companies: ["TechCorp", "FinanceFlow"]
      },
      "Як налаштувати Kubernetes для мікросервісів?": {
        answer: `Досвід HealthTech Solutions та TechCorp:\n\nHealthTech Solutions:\n- Helm charts для деплою\n- Istio для service mesh\n- Prometheus для моніторингу\n\nTechCorp додає:\n- ArgoCD для GitOps\n- Falco для security\n- Grafana для візуалізації\n\nНайкращий підхід: комбінація обох стратегій.`,
        confidence: 92,
        companies: ["HealthTech Solutions", "TechCorp"]
      }
    };

    return responses[question] || {
      answer: "AI агент може аналізувати підходи різних компаній та давати рекомендації на основі кращих практик.",
      confidence: 80,
      companies: ["TechCorp", "FinanceFlow", "HealthTech Solutions"]
    };
  }

  async demonstrateRealTimeSync() {
    console.log("\n🔄 Демонстрація реального часу синхронізації");
    console.log("=" * 45);

    console.log("📊 Сценарій: Нова задача створена в Jira TechCorp");
    console.log("🎯 Задача: 'Update React components library'");
    
    console.log("\n⚡ Що відбувається в реальному часі:");
    console.log("1. 🔔 Jira MCP отримує webhook про нову задачу");
    console.log("2. 📚 Notion MCP оновлює документацію компонентів");
    console.log("3. 🧠 Vector Service індексує новий контент");
    console.log("4. 🤖 AI агент тепер знає про оновлення");
    
    console.log("\n❓ Тест: 'Які компоненти оновлені в React бібліотеці?'");
    console.log("🤖 AI відповідь: 'Нещодавно оновлено Button, Input та Modal компоненти з новими пропсами. Деталі в задачі ONBD-205.'");
    console.log("📊 Довіра: 95% (актуальні дані з Jira)");
  }

  async demonstrateMultiTenantArchitecture() {
    console.log("\n🏗️ Архітектура підтримки множинних компаній");
    console.log("=" * 50);

    console.log("📊 DocuMinds як центральна база:");
    console.log("🏢 organizations table:");
    console.log("   - TechCorp (techcorp.com)");
    console.log("   - FinanceFlow (financeflow.com)");
    console.log("   - HealthTech Solutions (healthtech.com)");
    
    console.log("\n🔗 integrations table:");
    console.log("   - TechCorp Jira: https://techcorp.atlassian.net");
    console.log("   - TechCorp Notion: TechCorp Knowledge Base");
    console.log("   - FinanceFlow Jira: https://financeflow.atlassian.net");
    console.log("   - FinanceFlow Notion: FinanceFlow Documentation");
    
    console.log("\n📚 resources table:");
    console.log("   - TechCorp: React Guide, API Documentation");
    console.log("   - FinanceFlow: Python Best Practices, Database Schema");
    console.log("   - HealthTech: Java Guidelines, Security Protocols");

    console.log("\n🧠 Vector Service обробляє:");
    console.log("   - Організаційні дані з контекстом компанії");
    console.log("   - Інтеграційні налаштування для кожної системи");
    console.log("   - Ресурси з метаданими про джерело");
    console.log("   - Кросс-компанійні знання для порівняння");

    console.log("\n🤖 AI агент розуміє:");
    console.log("   - Контекст конкретної компанії");
    console.log("   - Роль співробітника в організації");
    console.log("   - Доступні ресурси та інтеграції");
    console.log("   - Кращі практики з інших компаній");
  }

  async runFullDemo() {
    console.log("🌍 Multi-Company AI Agent Demo");
    console.log("=" * 50);
    
    await this.demonstrateMultiCompanySupport();
    await this.demonstrateCrossCompanyKnowledge();
    await this.demonstrateRealTimeSync();
    await this.demonstrateMultiTenantArchitecture();

    console.log("\n🎉 Демонстрація завершена!");
    console.log("\n💡 Висновок:");
    console.log("✅ AI агент може працювати з різними Jira та Notion системами");
    console.log("✅ Підтримка множинних компаній через DocuMinds");
    console.log("✅ Контекстуальні відповіді для кожної організації");
    console.log("✅ Кросс-компанійний аналіз та рекомендації");
    console.log("✅ Реальний час синхронізації з живими системами");
    
    console.log("\n🚀 Готово для enterprise deployment!");
  }
}

// Запуск демонстрації
if (require.main === module) {
  const demo = new MultiCompanyAIDemo();
  demo.runFullDemo().catch(console.error);
}

module.exports = MultiCompanyAIDemo;
