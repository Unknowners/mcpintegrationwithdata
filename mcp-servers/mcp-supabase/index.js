#!/usr/bin/env node
/**
 * Простий MCP сервер для DocuMinds Supabase
 * Адаптований для хакатону OnboardAI
 */

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase клієнт
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rbmepcfznvcskxayuisp.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWVwY2Z6bnZjc2t4YXl1aXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjUzOTAsImV4cCI6MjA3NTAwMTM5MH0.ia2D4eT_VpqKApv4pdgTvHsvOCyR_XoCra73j2ElI9Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log(`🔗 Supabase MCP сервер підключено до: ${SUPABASE_URL}`);

// Базові маршрути
app.get('/', (req, res) => {
  res.json({
    name: "DocuMinds Supabase MCP Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      "/api/organizations": "Список організацій",
      "/api/integrations": "Список інтеграцій", 
      "/api/resources": "Список ресурсів",
      "/api/onboarding": "План онбордингу",
      "/api/database-info": "Аналіз структури бази даних DocuMinds",
      "/health": "Перевірка стану сервера"
    }
  });
});

// Отримання організацій + інформація про структуру таблиць
app.get('/api/organizations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(10);

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data ? data.length : 0,
      table_info: {
        name: "organizations",
        description: "Організації (компанії) в системі DocuMinds",
        fields: ["id", "name", "domain", "plan", "status"],
        status: data && data.length > 0 ? "має дані" : "порожня таблиця"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Новий ендпоінт для аналізу структури бази даних
app.get('/api/database-info', async (req, res) => {
  try {
    // Список таблиць для перевірки структур DocuMinds
    const tables = [
      'organizations',
      'profiles', 
      'organization_members',
      'integrations',
      'integration_credentials',
      'resources',
      'groups',
      'group_members',
      'resource_permissions',
      'audit_logs'
    ];

    const tableInfo = [];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        tableInfo.push({
          name: table,
          exists: !error,
          status: error ? `помилка: ${error.code}` : "таблиця існує",
          record_count: count || 0,
          schema_ready: !error
        });
      } catch (err) {
        tableInfo.push({
          name: table,
          exists: false,
          status: `не існує або недоступна`,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      supabase_url: SUPABASE_URL,
      analysis: "Аналіз структури бази даних DocuMinds",
      total_tables_checked: tables.length,
      tables_exist: tableInfo.filter(t => t.exists).length,
      tables_with_data: tableInfo.filter(t => t.record_count > 0).length,
      table_details: tableInfo
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Отримання інтеграцій для організації
app.get('/api/integrations/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;
    
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', orgId);

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Отримання ресурсів для інтеграції
app.get('/api/resources/:orgId/:integrationId', async (req, res) => {
  try {
    const { orgId, integrationId } = req.params;
    
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('organization_id', orgId)
      .eq('integration_id', integrationId)
      .eq('status', 'active');

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Спеціальний ендпоінт для онбордингу
app.post('/api/onboarding', async (req, res) => {
  try {
    const { email, role = 'general' } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email обов'язковий"
      });
    }

    // Витягуємо домен з email
    const domain = email.split('@')[1];
    
    // Знаходимо організацію за доменом
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('domain', domain)
      .single();

    if (orgError || !org) {
      return res.json({
        success: true,
        found: false,
        message: `Організацію для домену ${domain} не знайдено`,
        email,
        domain,
        role
      });
    }

    // Отримуємо інтеграції цієї організації
    const { data: integrations } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', org.id)
      .eq('status', 'connected');

    // Для кожної інтеграції отримуємо ресурси
    const onboardingData = {
      success: true,
      found: true,
      email,
      domain,
      role,
      organization: org,
      integrations: integrations || [],
      resources: []
    };

    if (integrations && integrations.length > 0) {
      for (const integration of integrations) {
        const { data: resources } = await supabase
          .from('resources')
          .select('*')
          .eq('organization_id', org.id)
          .eq('integration_id', integration.id)
          .eq('status', 'active')
          .limit(5); // Лімітуємо для демонстрації

        if (resources) {
          onboardingData.resources.push(...resources.map(r => ({
            ...r,
            integration_name: integration.name,
            integration_type: integration.type
          })));
        }
      }
    }

    // Генеруємо план онбордингу базуючись на ресурсах
    const onboardingPlan = generateOnboardingPlan(onboardingData);

    res.json(onboardingPlan);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Генерація плану онбордингу
function generateOnboardingPlan(data) {
  const { organization, resources, role, email } = data;
  
  return {
    ...data,
    onboarding_plan: {
      employee_email: email,
      organization_name: organization.name,
      role: role,
      onboarding_steps: [
        {
          step: 1,
          title: "Привітання та вступ",
          description: `Ласкаво просимо до ${organization.name}!`,
          estimated_time: "15 хвилин"
        },
        {
          step: 2,
          title: "Структура організації",
          description: "Ознайомлення з командою та підрозділами",
          estimated_time: "30 хвилин"
        },
        {
          step: 3,
          title: "Ресурси та документація",
          description: "Доступ до корпоративних ресурсів",
          resources: resources.slice(0, 3),
          estimated_time: "45 хвилин"
        },
        {
          step: 4,
          title: "Налаштування робочого простору",
          description: "Інтеграції та інструменти",
          integrations: resources.map(r => r.integration_type).filter((v, i, a) => a.indexOf(v) === i),
          estimated_time: "60 хвилин"
        },
        {
          step: 5,
          title: "Перші завдання",
          description: "Тестове завдання для ознайомлення з процесами",
          estimated_time: "120 хвилин"
        }
      ],
      recommended_resources: resources.slice(0, 5),
      next_action: "Замовлення зустрічі з менеджером"
    }
  };
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Внутрішня помилка сервера'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ендпоінт не знайдено'
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DocuMinds Supabase MCP сервер запущено на порту ${PORT}`);
  console.log(`📝 Доступний на http://localhost:${PORT}`);
  console.log(`⚡ Для Хакатону OnboardAI інтеграції з ${SUPABASE_URL}`);
});

module.exports = app;
