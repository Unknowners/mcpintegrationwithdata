-- OnboardAI Database Schema для Supabase
-- Створення таблиць для управління онбордингом співробітників

-- Таблиця співробітників
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  start_date DATE NOT NULL,
  manager_email VARCHAR(255),
  skills_required TEXT[],
  resources_needed TEXT[],
  status VARCHAR(50) DEFAULT 'onboarding_started',
  overall_progress INTEGER DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблиця завдань онбордингу
CREATE TABLE onboarding_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_days INTEGER DEFAULT 1,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблиця прогресу виконання завдань
CREATE TABLE onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, employee_id)
);

-- Таблиця бази знань
CREATE TABLE knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  role_specific BOOLEAN DEFAULT FALSE,
  department VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  url VARCHAR(500),
  confidence_score FLOAT DEFAULT 1.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблиця Q&A історії
CREATE TABLE qa_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  confidence FLOAT CHECK (confidence >= 0.0 AND confidence <= 1.0),
  sources TEXT[] DEFAULT '{}',
  was_helpful BOOLEAN,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблиця менторів
CREATE TABLE mentors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  mentee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  department VARCHAR(100),
  skills TEXT[] DEFAULT '{}',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  notes TEXT,
  UNIQUE(employee_id, mentee_id)
);

-- Таблиця інтеграцій
CREATE TABLE integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  api_endpoint VARCHAR(500),
  api_key_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  config_data JSONB DEFAULT '{}',
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблиця метрик та аналітики
CREATE TABLE onboarding_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value FLOAT,
  metric_unit VARCHAR(50),
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Створення індексів для оптимізації
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_start_date ON employees(start_date);
CREATE INDEX idx_onboarding_tasks_employee_id ON onboarding_tasks(employee_id);
CREATE INDEX idx_onboarding_tasks_status ON onboarding_tasks(status);
CREATE INDEX idx_onboarding_progress_employee_id ON onboarding_progress(employee_id);
CREATE INDEX idx_knowledge_base_role ON knowledge_base(role_specific);
CREATE INDEX idx_knowledge_base_tags ON knowledge_base USING GIN(tags);
CREATE INDEX idx_qa_interactions_employee_id ON qa_interactions(employee_id);
CREATE INDEX idx_mentors_active ON mentors(is_active);
CREATE INDEX idx_integrations_service ON integrations(service_name);
CREATE INDEX idx_integrations_active ON integrations(is_active);

-- Функція для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригери для автоматичного оновлення updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_tasks_updated_at BEFORE UPDATE ON onboarding_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_progress_updated_at BEFORE UPDATE ON onboarding_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функція для розрахунку загального прогрес співробітника
CREATE OR REPLACE FUNCTION calculate_overall_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE employees 
  SET overall_progress = (
    SELECT COALESCE(AVG(progress_percentage), 0)
    FROM onboarding_progress 
    WHERE employee_id = NEW.employee_id
  )
  WHERE id = NEW.employee_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригер для автоматичного розрахунку прогрес
CREATE TRIGGER calculate_progress_trigger 
AFTER INSERT OR UPDATE ON onboarding_progress 
FOR EACH ROW EXECUTE FUNCTION calculate_overall_progress();

-- Вставка прикладух даних для демонстрації
INSERT INTO employees (name, email, role, department, start_date, manager_email, skills_required, resources_needed) VALUES
('Іван Петренко', 'ivan.petrenko@company.com', 'Frontend Developer', 'Engineering', '2024-01-15', 'manager@company.com', '{"React", "TypeScript", "CSS"}', '{"Laptop", "Monitor", "IDE License"}'),
('Марія Сидоренко', 'maria.sydorenko@company.com', 'Backend Developer', 'Engineering', '2024-01-20', 'manager@company.com', '{"Python", "Django", "SQL"}', '{"Laptop", "Database Access"}'),
('Олексій Коваленко', 'olexii.kovalenko@company.com', 'Data Analyst', 'Analytics', '2024-01-25', 'analytics@company.com', '{"SQL", "Python", "Tableau"}', '{"Laptop", "BI Tools Access"}');

-- Базові завдання онбордингу
INSERT INTO onboarding_tasks (employee_id, task_name, description, duration_days, priority, status) 
SELECT 
  e.id,
  'Налаштування робочого середовища',
  'Інсталяція необхідних інструментів та налаштування IDE',
  1,
  'high',
  'pending'
FROM employees e WHERE e.role IN ('Frontend Developer', 'Backend Developer');

INSERT INTO onboarding_tasks (employee_id, task_name, description, duration_days, priority, status) 
SELECT 
  e.id,
  'Ознайомлення з кодом',
  'Study the codebase structure and architecture',
  3,
  'high',
  'pending'
FROM employees e;

INSERT INTO onboarding_tasks (employee_id, task_name, description, duration_days, priority, status) 
SELECT 
  e.id,
  'Знайомство з командою',
  'Meet team members and understand responsibilities',
  1,
  'medium',
  'pending'
FROM employees e;

-- База знань
INSERT INTO knowledge_base (title, content, role_specific, department, tags, url, confidence_score) VALUES
('React Quick Start Guide', 'Основні концепції React, компоненти, props та state', true, 'Engineering', '{"react", "frontend", "javascript"}', 'https://docs.company.com/react-guide', 0.95),
('Python API Development', 'Розробка REST API на Python з Flask або Django', true, 'Engineering', '{"python", "api", "backend"}', 'https://docs.company.com/python-api', 0.90),
('Company Onboarding Process', 'Загальний процес адаптації нових співробітників в компанії', false, 'HR', '{"onboarding", "process", "hr"}', 'https://docs.company.com/onboarding', 0.85);

-- RLS (Row Level Security) політики
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_interactions ENABLE ROW LEVEL SECURITY;

-- Політики безпеки (на прикладі)
CREATE POLICY "Employees can view own data" ON employees FOR SELECT USING (auth.jwt() ->> 'email' = email);
CREATE POLICY "HR can view all employees" ON employees FOR ALL USING (auth.jwt() ->> 'role' = 'hr');

-- Створення представлень для зручного доступу до даних
CREATE VIEW employee_onboarding_summary AS
SELECT 
  e.id,
  e.name,
  e.email,
  e.role,
  e.department,
  e.status,
  e.overall_progress,
  COUNT(ot.id) as total_tasks,
  COUNT(CASE WHEN ot.status = 'completed' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN ot.priority = 'high' AND ot.status != 'completed' THEN 1 END) as pending_high_priority_tasks
FROM employees e
LEFT JOIN onboarding_tasks ot ON e.id = ot.employee_id
GROUP BY e.id, e.name, e.email, e.role, e.department, e.status, e.overall_progress;

COMMENT ON TABLE employees IS 'Основна таблиця співробітників для процесу онбордингу';
COMMENT ON TABLE onboarding_tasks IS 'Завдання онбордингу з розподіленням по співробітниках';
COMMENT ON TABLE onboarding_progress IS 'Прогрес виконання завдань онбордингу';
COMMENT ON TABLE knowledge_base IS 'База знань з документацією та відповідями';
COMMENT ON TABLE qa_interactions IS 'Історія питань та відповідей для покращення системи';
