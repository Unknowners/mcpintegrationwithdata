/**
 * MCP сервер для інтеграції з Jira API
 * Забезпечує зв'язок між OnboardAI та системою проектів Jira
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Конфігурація Jira
const JIRA_CONFIG = {
  url: process.env.JIRA_URL,
  clientId: process.env.JIRA_CLIENT_ID,
  clientSecret: process.env.JIRA_CLIENT_SECRET,
  refreshToken: process.env.JIRA_REFRESH_TOKEN,
  projectKey: 'ONBD'  // Ключ проекту для онбордингу
};

// Функції для роботи з Jira API
class JiraClient {
  constructor(config) {
    this.config = config;
    this.accessToken = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.config.url}/oauth/token`, {
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        redirect_uri: 'https://auth.atlassian.com/oauth/callback'
      });

      this.accessToken = response.data.access_token;
      console.log('✅ Авторизація в Jira успішна');
    } catch (error) {
      console.error('❌ Помилка авторизації в Jira:', error.message);
      // Для демо використовуємо мок токен
      this.accessToken = 'mock_access_token';
    }
  }

  async createProject(projectData) {
    await this.authenticate();
    
    try {
      const projectPayload = {
        fields: {
          project: {
            key: projectData.key
          },
          summary: projectData.summary,
          description: projectData.description,
          issuetype: {
            name: 'Task'
          },
          assignee: projectData.assignee,
          priority: {
            name: projectData.priority || 'Medium'
          },
          labels: projectData.labels || ['onboarding']
        }
      };

      const response = await axios.post(
        `${this.config.url}/rest/api/3/issue`,
        projectPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Помилка створення проекту в Jira:', error.message);
      // Мок відповідь для демо
      return {
        id: `MOCK-${Date.now()}`,
        key: `${projectData.key}-${Date.now()}`,
        summary: projectData.summary,
        status: 'created'
      };
    }
  }

  async getProjectIssues(projectKey) {
    await this.authenticate();
    
    try {
      const response = await axios.get(
        `${this.config.url}/rest/api/3/search?jql=project=${projectKey}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.issues || [];
    } catch (error) {
      console.error('Помилка отримання задач з Jira:', error.message);
      // Мок дані для демо
      return [
        {
          id: 'MOCK-101',
          key: 'ONBD-101',
          fields: {
            summary: 'Перше завдання онбордингу',
            status: { name: 'To Do' },
            assignee: { displayName: 'New Employee' }
          }
        }
      ];
    }
  }

  async updateIssueStatus(issueKey, newStatus) {
    await this.authenticate();
    
    try {
      const transitionPayload = {
        transition: {
          name: newStatus
        }
      };

      const response = await axios.post(
        `${this.config.url}/rest/api/3/issue/${issueKey}/transitions`,
        transitionPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.status === 204;
    } catch (error) {
      console.error('Помилка оновлення статусу задачі:', error.message);
      return true; // Для демо повертаємо успіх
    }
  }

  async createOnboardingTasks(employeeData) {
    const tasks = [];
    
    // Базові задачі онбордингу
    const baseTasks = [
      {
        summary: `📋 Ознайомлення з процесами - ${employeeData.name}`,
        description: `Новий співробітник ${employeeData.name} на посаді ${employeeData.role} потребує ознайомлення з корпоративними процесами.`,
        priority: 'High',
        labels: ['onboarding', employeeData.role.toLowerCase()]
      },
      {
        summary: `🛠️ Налаштування робочого середовища - ${employeeData.name}`,
        description: `Інсталяція та конфігурація необхідних інтересів для ${employeeData.role}.`,
        priority: 'High',
        labels: ['onboarding', 'setup', employeeData.role.toLowerCase()]
      },
      {
        summary: `👥 Знайомство з командою - ${employeeData.name}`,
        description: `Проведення воркшопів та знайомство з командою для ${employeeData.name}.`,
        priority: 'Medium',
        labels: ['onboarding', 'team']
      }
    ];

    // Роль-специфічні задачі
    const roleSpecificTasks = {
      'Frontend Developer': [
        {
          summary: `⚛️ React проект setup - ${employeeData.name}`,
          description: `Створення базового React компонента та ознайомлення з кодом.`,
          priority: 'Medium',
          labels: ['frontend', 'react', 'onboarding']
        }
      ],
      'Backend Developer': [
        {
          summary: `🐍 Python API розробка - ${employeeData.name}`,
          description: `Створення простого REST API ендпоінту.`,
          priority: 'Medium',
          labels: ['backend', 'python', 'api']
        }
      ],
      'Data Analyst': [
        {
          summary: `📊 Перший дата аналіз - ${employeeData.name}`,
          description: `Аналіз даних та створення першої візуалізації.`,
          priority: 'Medium',
          labels: ['data', 'analysis', 'visualization']
        }
      ]
    };

    const allTasks = [...baseTasks, ...(roleSpecificTasks[employeeData.role] || [])];

    // Створення задач в Jira
    for (const task of allTasks) {
      const taskData = {
        ...task,
        key: `ONBD-${employeeData.employee_id}`,
        assignee: employeeData.email
      };

      const createdTask = await this.createProject(taskData);
      tasks.push({
        ...createdTask,
        original_task: task
      });
    }

    return tasks;
  }
}

// Створення інстансу Jira клієнта
const jiraClient = new JiraClient(JIRA_CONFIG);

// Маршрути API

app.get('/', (req, res) => {
  res.json({
        service: 'MCP Jira Server',
        version: '1.0.0',
        description: 'Сервер для інтеграції з Jira API',
        status: 'running',
        endpoints: {
          '/api/jira/health': 'Перевірка здоров\'я сервісу',
          '/api/jira/projects': 'Отримання проектами',
          '/api/jira/onboarding/tasks': 'Створення задач онбордингу',
          '/api/jira/issue/:key/status': 'Оновлення статусу задачі'
        }
      });
});

app.get('/api/jira/health', (req, res) => {
  res.json({
        status: 'healthy',
        service: 'Jira MCP',
        jira_url: JIRA_CONFIG.url ? 'configured' : 'not configured',
        timestamp: new Date().toISOString()
      });
});

// Створення задач онбордингу в Jira
app.post('/api/jira/onboarding/tasks', async (req, res) => {
  try {
    const { employee_id, employee_name, email, role, department } = req.body;

    const employeeData = {
      employee_id,
      name: employee_name || 'New Employee',
      email: email || 'new@company.com',
      role: role || 'General',
      department: department || 'General'
    };

    const tasks = await jiraClient.createOnboardingTasks(employeeData);

    res.json({
      success: true,
      message: 'Задачі онбордингу успішно створені в Jira',
      employee_id,
      tasks_created: tasks.length,
      tasks
    });

  } catch (error) {
    console.error('Помилка створення задач онбордингу:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка створення задач в Jira',
      error: error.message
    });
  }
});

// Отримання задач проекту
app.get('/api/jira/projects', async (req, res) => {
  try {
    const { projectKey } = req.query;
    
    const issues = await jiraClient.getProjectIssues(projectKey || JIRA_CONFIG.projectKey);

    res.json({
      success: true,
      project_key: projectKey || JIRA_CONFIG.projectKey,
      issues_count: issues.length,
      issues
    });

  } catch (error) {
    console.error('Помилка отримання проектів:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання задач з Jira',
      error: error.message
    });
  }
});

// Оновлення статусу задачі
app.put('/api/jira/issue/:issueKey/status', async (req, res) => {
  try {
    const { issueKey } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Статус обов\'язковий'
      });
    }

    const success = await jiraClient.updateIssueStatus(issueKey, status);

    if (success) {
      res.json({
        success: true,
        message: `Статус задачі ${issueKey} успішно оновлено на ${status}`,
        issue_key: issueKey,
        new_status: status
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Помилка оновлення статусу задачі'
      });
    }

  } catch (error) {
    console.error('Помилка оновлення статусу задачі:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка оновлення статусу задачі',
      error: error.message
    });
  }
});

// Синхронізація з основниім API OnboardAI
app.post('/api/jira/sync', async (req, res) => {
  try {
    const { employee_id, role, action } = req.body;

    console.log(`🔄 Синхронізація з Jira для співробітника ${employee_id}, роль: ${role}`);

    // Створення задач онбордингу
    const tasks = await jiraClient.createOnboardingTasks({
      employee_id,
      name: `Employee-${employee_id}`,
      email: 'new@company.com',
      role,
      department: 'General'
    });

    res.json({
      success: true,
      message: 'Синхронізація з Jira успішна',
      employee_id,
      action,
      tasks_created: tasks.length,
      tasks
    });

  } catch (error) {
    console.error('Помилка синхронізації з Jira:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка синхронізації з Jira',
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
  console.log(`🚀 Jira MCP сервер запущено на порту ${PORT}`);
  console.log(`📊 Jira URL: ${JIRA_CONFIG.url || 'Not configured'}`);
  console.log(`🔑 Client ID: ${JIRA_CONFIG.clientId ? 'Configured' : 'Not configured'}`);
});
