/**
 * MCP сервер для інтеграції з Notion API
 * Забезпечує зв'язок між OnboardAI та системою документації Notion
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3022;

// Middleware
app.use(cors());
app.use(express.json());

// Конфігурація Notion
const NOTION_CONFIG = {
  apiKey: process.env.NOTION_API_KEY,
  databaseId: process.env.NOTION_DATABASE_ID,
  onboardingPageId: process.env.NOTION_ONBOARDING_PAGE_ID || 'mock-page-id'
};

// Конфігурація DocuMinds Supabase
const DOCUMINDS_CONFIG = {
  url: 'https://rbmepcfznvcskxayuisp.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWVwY2Z6bnZjc2t4YXl1aXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjUzOTAsImV4cCI6MjA3NTAwMTM5MH0.ia2D4eT_VpqKApv4pdgTvHsvOCyR_XoCra73j2ElI9Y',
  // Використовуємо Supabase REST API
  apiUrl: 'https://rbmepcfznvcskxayuisp.supabase.co/rest/v1'
};

// Функція для отримання даних з DocuMinds
async function getDocuMindsResources(organizationDomain, integrationType = 'notion') {
  try {
    // Спочатку знайти організацію
    const orgResponse = await axios.get(`${DOCUMINDS_CONFIG.apiUrl}/organizations`, {
      headers: {
        'apikey': DOCUMINDS_CONFIG.anonKey,
        'Authorization': `Bearer ${DOCUMINDS_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        domain: `eq.${organizationDomain}`,
        select: 'id,name,domain'
      }
    });

    if (!orgResponse.data || orgResponse.data.length === 0) {
      console.log(`Організацію з доменом ${organizationDomain} не знайдено в DocuMinds`);
      return [];
    }

    const org = orgResponse.data[0];

    // Знайти інтеграцію Notion для цієї організації
    const integrationResponse = await axios.get(`${DOCUMINDS_CONFIG.apiUrl}/integrations`, {
      headers: {
        'apikey': DOCUMINDS_CONFIG.anonKey,
        'Authorization': `Bearer ${DOCUMINDS_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        organization_id: `eq.${org.id}`,
        type: `eq.${integrationType}`,
        status: `eq.connected`,
        select: 'id,name,type,status'
      }
    });

    if (!integrationResponse.data || integrationResponse.data.length === 0) {
      console.log(`Інтеграцію ${integrationType} не знайдено для організації ${organizationDomain}`);
      return [];
    }

    const integration = integrationResponse.data[0];

    // Отримати ресурси з цієї інтеграції
    const resourcesResponse = await axios.get(`${DOCUMINDS_CONFIG.apiUrl}/resources`, {
      headers: {
        'apikey': DOCUMINDS_CONFIG.anonKey,
        'Authorization': `Bearer ${DOCUMINDS_CONFIG.anonKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        organization_id: `eq.${org.id}`,
        integration_id: `eq.${integration.id}`,
        status: `eq.active`,
        select: 'id,name,type,url,last_synced_at'
      }
    });

    if (!resourcesResponse.data) {
      return [];
    }

    return resourcesResponse.data.map(resource => ({
      title: resource.name,
      content: `Документ з ${integrationType}: ${resource.name}`,
      url: resource.url || '#',
      role_specific: false,
      tags: [integrationType, resource.type],
      documinds_id: resource.id,
      last_synced: resource.last_synced_at
    }));

  } catch (error) {
    console.error('Помилка отримання ресурсів з DocuMinds:', error.message);
    return [];
  }
}

// База знань OnboardAI (fallback)
const KNOWLEDGE_BASE = {
  "Frontend Developer": [
    {
      title: "React Development Guide",
      content: "Повний гайд по розробці з React, включаючи хуки, компоненти та найкращі практики.",
      url: "https://docs.company.com/react-guide",
      tags: ["react", "frontend", "javascript"]
    },
    {
      title: "CSS Frameworks Best Practices",
      content: "Рекомендації по використанню CSS фреймворків та компонентних систем.",
      url: "https://docs.company.com/css-practices",
      tags: ["css", "design-system", "ui"]
    },
    {
      title: "Testing Strategy for Frontend",
      content: "Як правильно тестувати React компоненти ді Unit та Integration тестами.",
      url: "https://docs.company.com/testing",
      tags: ["testing", "jest", "react-testing"]
    }
  ],
  "Backend Developer": [
    {
      title: "Python API Development",
      content: "Розробка REST API на Python/Flask та Django з найкращими практиками.",
      url: "https://docs.company.com/python-apis",
      tags: ["python", "api", "rest", "django"]
    },
    {
      title: "Database Design Patterns",
      content: "Архітектурні патерни для проектування реляційних та NoSQL баз даних.",
      url: "https://docs.company.com/database-design",
      tags: ["database", "sql", "mongodb", "architecture"]
    },
    {
      title: "Microservices Architecture",
      content: "Як проектувати та розгортати мікросервіси для масштабованих додатків.",
      url: "https://docs.company.com/microservices",
      tags: ["microservices", "docker", "kubernetes", "architecture"]
    }
  ],
  "Data Analyst": [
    {
      title: "SQL Query Optimization",
      content: "Найкращі практики оптимізації SQL запитаніє для великих наборів даних.",
      url: "https://docs.company.com/sql-optimization",
      tags: ["sql", "optimization", "data"]
    },
    {
      title: "Python Data Analysis",
      content: "Використання Pandas, NumPy та інших бібліотек для аналізу даних.",
      url: "https://docs.company.com/python-analysis",
      tags: ["python", "pandas", "numpy", "analysis"]
    },
    {
      title: "Data Visualization Best Practices",
      content: "Як створювати ефективні інфогафіки та дашборди.",
      url: "https://docs.company.com/data-viz",
      tags: ["visualization", "charts", "dashboard", "insights"]
    }
  ]
};

// FAQ для різних ролей
const FAQ_BASE = {
  "Frontend Developer": [
    {
      question: "Як налаштувати тестовий проект?",
      answer: "Використовуйте команду `npm create-react-app test-project` та відкрийте в вашому улюбленому редакторі.",
      category: "Setup"
    },
    {
      question: "Які компоненти є в компанійній UI бібліотеці?",
      answer: "У нас є Button, Input, Modal, Table та інші компоненти. Документація тут: https://ui.company.com",
      category: "Components"
    },
    {
      question: "Як працювати з API з React?",
      answer: "Використовуйте axios або вбудований fetch. Приклад в нашому гайді по API integration.",
      category: "API Integration"
    }
  ],
  "Backend Developer": [
    {
      question: "Як підключитися до бази даних?",
      answer: "Настройте environment variables DATABASE_URL та перевірте конфігурацію в налаштунках.",
      category: "Database"
    },
    {
      question: "Які стандарти кодування ми використовуємо?",
      answer: "PEP 8 для Python. Використовуйте black для форматування, pylint для лінтінг.",
      category: "Coding Standards"
    },
    {
      question: "Як деплоїти продукти?",
      answer: "Використовуються Docker контейнери та CI/CD пайплайни. Деталі в DevOps гайді.",
      category: "Deployment"
    }
  ],
  "Data Analyst": [
    {
      question: "Які інструменти для BI ми використовуємо?",
      answer: "Tableau для візуалізації, Jupyter для експлораційного аналізу даних.",
      category: "Tools"
    },
    {
      question: "Де знайти приклади датасетів для тестування?",
      answer: "У нашій внутрішній базі є sales_data, user_behavior та marketing_metrics датасети.",
      category: "Datasets"
    }
  ]
};

// Функції для роботи з Notion API
class NotionClient {
  constructor(config) {
    this.config = config;
    this.isAuthenticated = !!config.apiKey;
  }

  async authenticate() {
    if (!this.isAuthenticated) {
      console.log('⚠️  Notion API ключ не надано, працюємо в демо режимі');
      return false;
    }

    try {
      const response = await this.makeRequest('GET', '/v1/users/me');
      console.log('✅ Авторизація в Notion успішна');
      return true;
    } catch (error) {
      console.error('❌ Помилка авторизації в Notion:', error.message);
      return false;
    }
  }

  async makeRequest(method, endpoint, data = null) {
    if (!this.isAuthenticated) {
      throw new Error('Notion API не налаштована');
    }

    const axiosConfig = {
      method,
      url: `https://api.notion.com${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      axiosConfig.data = data;
    }

    const response = await axios(axiosConfig);
    return response.data;
  }

  async createOnboardingPage(employeeData) {
    if (!this.isAuthenticated) {
      return this.createMockOnboardingPage(employeeData);
    }

    try {
      const pageData = {
        parent: { page_id: this.config.onboardingPageId },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: `Onboarding Plan - ${employeeData.name}`
                }
              }
            ]
          },
          Status: {
            select: {
              name: 'In Progress'
            }
          },
          Role: {
            select: {
              name: employeeData.role
            }
          },
          Department: {
            select: {
              name: employeeData.department || 'General'
            }
          }
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `Персональний план онбордингу для ${employeeData.name} на посаді ${employeeData.role}.`
                  }
                }
              ]
            }
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: 'Заповнити анкету співробітника'
                  }
                }
              ]
            }
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: 'Налаштувати робоче середовище'
                  }
                }
              ]
            }
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: 'Ознайомитися з командним процесом'
                  }
                }
              ]
            }
          }
        ]
      };

      const page = await this.makeRequest('POST', '/v1/pages', pageData);
      return page;
    } catch (error) {
      console.error('Помилка створення сторінки онбордингу в Notion:', error.message);
      return this.createMockOnboardingPage(employeeData);
    }
  }

  createMockOnboardingPage(employeeData) {
    return {
      id: `mock-page-${Date.now()}`,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
      url: `https://notion.so/mock-onboarding-${employeeData.name.toLowerCase().replace(' ', '-')}`,
      properties: {
        title: `Onboarding Plan - ${employeeData.name}`,
        status: 'In Progress',
        role: employeeData.role
      }
    };
  }

  async getResources(role) {
    // Повертаємо ресурси з нашої внутрішньої бази знань
    return KNOWLEDGE_BASE[role] || KNOWLEDGE_BASE["Frontend Developer"]; // fallback
  }

  async getFAQ(role) {
    // Повертаємо FAQ з нашої внутрішньої бази
    return FAQ_BASE[role] || FAQ_BASE["Frontend Developer"]; // fallback
  }

  async searchContent(query, filters = {}) {
    // Спрощений пошук по нашій базі знань
    const results = [];
    
    for (const [role, resources] of Object.entries(KNOWLEDGE_BASE)) {
      for (const resource of resources) {
        const searchText = `${resource.title} ${resource.content} ${resource.tags.join(' ')}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          results.push({
            ...resource,
            role,
            relevance: this.calculateRelevance(query, resource)
          });
        }
      }
    }

    // Сортуємо по релевантності
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  calculateRelevance(query, resource) {
    const queryLower = query.toLowerCase();
    let relevance = 0;

    if (resource.title.toLowerCase().includes(queryLower)) relevance += 3;
    if (resource.content.toLowerCase().includes(queryLower)) relevance += 2;
    if (resource.tags.some(tag => tag.toLowerCase().includes(queryLower))) relevance += 1;

    return relevance;
  }
}

// Створення інстансу Notion клієнта
const notionClient = new NotionClient(NOTION_CONFIG);

// Маршрути API

app.get('/', (req, res) => {
  res.json({
        service: 'MCP Notion Server',
        version: '1.0.0',
        description: 'Сервер для інтеграції з Notion API',
        status: 'running',
        authenticated: notionClient.isAuthenticated,
        endpoints: {
          '/api/notion/health': 'Перевірка здоров\'я сервісу',
          '/api/resources/role/:role': 'Ресурси для конкретної ролі',
          '/api/faq/:role': 'FAQ для конкретної ролі',
          '/api/search': 'Пошук по базі знань',
          '/api/onboarding/page': 'Створення сторінки онбордингу'
        }
      });
});

app.get('/api/notion/health', async (req, res) => {
  const authSuccess = notionClient.isAuthenticated ? await notionClient.authenticate() : false;
  
  res.json({
        status: 'healthy',
        service: 'Notion MCP',
        notion_configured: notionClient.isAuthenticated,
        notion_authenticated: authSuccess,
        database_id: NOTION_CONFIG.databaseId ? 'configured' : 'not configured',
        timestamp: new Date().toISOString()
      });
});

// Отримання ресурсів для конкретної ролі
app.get('/api/resources/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const resources = await notionClient.getResources(role);

    res.json({
      success: true,
      role,
      resource_count: resources.length,
      resources
    });

  } catch (error) {
    console.error('Помилка отримання ресурсів:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання ресурсів з Notion',
      error: error.message
    });
  }
});

// Отримання FAQ для конкретної ролі
app.get('/api/faq/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const faq = await notionClient.getFAQ(role);

    res.json({
      success: true,
      role,
      faq_count: faq.length,
      faq
    });

  } catch (error) {
    console.error('Помилка отримання FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання FAQ',
      error: error.message
    });
  }
});

// Пошук по базі знань
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    const role = req.query.role || '';

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Параметр query обов\'язковий'
      });
    }

    const results = await notionClient.searchContent(query, { role });
    
    res.json({
      success: true,
      query,
      role: role || 'all',
      results_count: results.length,
      results
    });

  } catch (error) {
    console.error('Помилка пошуку:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка пошуку в базі знань',
      error: error.message
    });
  }
});

// Створення сторінки онбордингу в Notion
app.post('/api/onboarding/page', async (req, res) => {
  try {
    const { employee_id, name, role, department, email } = req.body;

    const employeeData = {
      employee_id,
      name: name || 'New Employee',
      role: role || 'General',
      department: department || 'General',
      email: email || 'new@company.com'
    };

    const page = await notionClient.createOnboardingPage(employeeData);

    res.json({
      success: true,
      message: 'Сторінка онбордингу успішно створена в Notion',
      employee_id,
      page_url: page.url,
      page_id: page.id,
      created_at: page.created_time
    });

  } catch (error) {
    console.error('Помилка створення сторінки онбордингу:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка створення сторінки в Notion',
      error: error.message
    });
  }
});

// Отримання всієї бази знань
app.get('/api/knowledge-base', async (req, res) => {
  try {
    const { role } = req.query;
    
    let knowledgeBase = KNOWLEDGE_BASE;
    if (role && KNOWLEDGE_BASE[role]) {
      knowledgeBase = { [role]: KNOWLEDGE_BASE[role] };
    }

    res.json({
      success: true,
      role: role || 'all',
      knowledge_base: knowledgeBase
    });

  } catch (error) {
    console.error('Помилка отримання бази знань:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання бази знань',
      error: error.message
    });
  }
});

// Обробка помилок
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Внутрішня помилка сервера',
    error: error.message
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Notion MCP сервер запущено на порту ${PORT}`);
  console.log(`📝 Notion API Key: ${NOTION_CONFIG.apiKey ? 'Configured' : 'Not configured'}`);
  console.log(`🗂️  Database ID: ${NOTION_CONFIG.databaseId || 'Not configured'}`);
  console.log(`🔍 Knowledge base entries: ${Object.keys(KNOWLEDGE_BASE).length * KNOWLEDGE_BASE['Frontend Developer'].length}`);
});
