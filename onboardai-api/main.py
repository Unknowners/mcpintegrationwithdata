"""
OnboardAI - Основний FastAPI додаток для управління онбордингом співробітників
Інтеграція з DocuMinds для отримання ресурсів та доступу до корпоративної документації
"""

import os
import json
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import redis
from supabase import create_client, Client
from vector_service import VectorService

app = FastAPI(
    title="OnboardAI API",
    description="""
    🚀 **OnboardAI** - SaaS-платформа для швидкого онбордингу нових співробітників
    
    ## Основні можливості:
    - 🎯 **Персональні плани онбордингу** для нових співробітників
    - 📚 **Автоматичне отримання ресурсів** з DocuMinds, Notion та Jira
    - 🤔 **Q&A система** з базою знань
    - 📊 **Відстеження прогресу** онбордингу в реальному часі
    - 🔗 **Інтеграція з корпоративними системами** через MCP сервери
    
    ## Архітектура:
    - **FastAPI** головний сервер з автоматичною документацією
    - **MCP сервери** для інтеграції з Jira, Notion та Supabase
    - **Redis** для кешування та управління чергами
    - **Supabase** для збереження даних та аутентифікації
    """,
    version="1.0.0",
    contact={
        "name": "OnboardAI Support",
        "email": "support@onboardai.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    keywords=["onboarding", "employee", "SaaS", "FastAPI", "MCP", "integration"],
    openapi_tags=[
        {
            "name": "health",
            "description": "🩺 Health check та системна інформація",
        },
        {
            "name": "onboarding",
            "description": "📋 Управління процесом онбордингу співробітників",
        },
        {
            "name": "documinds",
            "description": "🗄️ Інтебрація з DocuMinds для отримання корпоративних ресурсів",
        },
        {
            "name": "qa",
            "description": "🤔 Q&A система та база знань",
        },
        {
            "name": "progress",
            "description": "📊 Відстеження та оновлення прогресу онбордингу",
        },
        {
            "name": "vectorization",
            "description": "🧠 Векторизація корпоративних знань та семантичний пошук",
        },
        {
            "name": "ai-knowledge",
            "description": "🤖 AI-помічник з контекстуальними відповідями",
        },
    ],
)

# CORS міделваре
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшені обмежити конкретними доменами
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Конфігурація DocuMinds Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://rbmepcfznvcskxayuisp.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWVwY2Z6bnZjc2t4YXl1aXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjUzOTAsImV4cCI6MjA3NTAwMTM5MH0.ia2D4eT_VpqKApv4pdgTvHsvOCyR_XoCra73j2ElI9Y")
MCP_JIRA_HOST = os.getenv("MCP_JIRA_HOST", "http://mcp-jira:3001")
MCP_NOTION_HOST = os.getenv("MCP_NOTION_HOST", "http://mcp-notion:3002")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

# Ініціалізація клієнтів
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
redis_client = redis.from_url(REDIS_URL)

# Ініціалізація векторного сервісу
vector_service = None
try:
    vector_service = VectorService()
except Exception as e:
    print(f"Попередження: Не вдалося ініціалізувати векторний сервіс: {e}")

# Pydantic моделі
class EmployeeOnboarding(BaseModel):
    name: str
    email: str
    role: str
    department: str
    start_date: str
    manager_email: str
    skills_required: List[str]
    resources_needed: List[str]

class QAResponse(BaseModel):
    question: str
    answer: str
    confidence: float
    sources: List[str]

class TaskProgress(BaseModel):
    task_id: str
    employee_id: str
    status: str  # "pending", "in_progress", "completed"
    progress_percentage: int
    notes: Optional[str] = None

class KnowledgeBaseEntry(BaseModel):
    title: str
    content: str
    role_specific: bool
    department: Optional[str] = None
    tags: List[str]

class DocuMindsResource(BaseModel):
    id: str
    name: str
    type: str
    url: Optional[str] = None
    integration: str
    last_synced_at: Optional[str] = None

class DocuMindsIntegration(BaseModel):
    id: str
    name: str
    type: str
    status: str

# Моделі відповідей API
class OnboardingPlanResponse(BaseModel):
    employee_id: str
    personalized_plan: Dict
    estimated_duration_days: int
    tasks: List[Dict]
    resources: List[str]
    qa_sessions: List[Dict]

@app.get("/", tags=["health"], summary="🔍 Базова інформація про API")
async def root():
    """
    Базова інформація про OnboardAI API
    
    Повертає основну інформацію про сервіс, версію та статус.
    Використовується для швидкої перевірки доступності API.
    """
    return {
        "service": "OnboardAI API",
        "version": "1.0.0",
        "description": "Система для управління онбордингом співробітників",
        "status": "running",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "openapi_url": "/openapi.json"
    }

@app.get("/health", tags=["health"], summary="🏥 Health Check")
async def health_check():
    """
    Детальна перевірка здоров'я всіх сервісів
    
    Перевіряє доступність та стан:
    - Основного API сервера
    - Supabase бази даних 
    - Redis кешу
    - MCP серверів (Jira, Notion)
    
    Повертає детальну інформацію про кожен компонент системи.
    """
    # Перевірка з'єднання з Supabase
    try:
        supabase.table("employees").select("count", count="exact").execute()
        supabase_status = "healthy"
    except Exception as e:
        supabase_status = f"error: {str(e)}"
    
    # Перевірка Redis
    try:
        redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "supabase": supabase_status,
        "redis": redis_status,
        "mcp_jira_url": MCP_JIRA_HOST,
        "mcp_notion_url": MCP_NOTION_HOST
    }

@app.post("/api/v1/onboarding/create", response_model=OnboardingPlanResponse, tags=["onboarding"], summary="🚀 Створення плану онбордингу")
async def create_onboarding_plan(
    employee: EmployeeOnboarding,
    background_tasks: BackgroundTasks
):
    """
    Створення персонального плану онбордингу для нового співробітника
    
    ## Що робить:
    1. **Зберігає дані співробітника** в Supabase
    2. **Генерує персональний план** на основі ролі та навичок
    3. **Створює завдання** специфічні для ролі
    4. **Отримує ресурси** з DocuMinds та Notion
    5. **Планує Q&A сесії** з ментором
    6. **Запускає фонові задачі** для синхронізації з Jira
    
    ## Приклад використання:
    ```json
    {
        "name": "Іван Іванов",
        "email": "ivan@company.com",
        "role": "Frontend Developer",
        "department": "Engineering",
        "start_date": "2024-02-01",
        "manager_email": "manager@company.com",
        "skills_required": ["React", "TypeScript"],
        "resources_needed": ["Development Environment"]
    }
    ```
    
    Повертає детальний план з завданнями та ресурсами.
    """
    
    try:
        # Зберігання інформації про співробітника в Supabase
        employee_data = {
            "name": employee.name,
            "email": employee.email,
            "role": employee.role,
            "department": employee.department,
            "start_date": employee.start_date,
            "manager_email": employee.manager_email,
            "skills_required": employee.skills_required,
            "resources_needed": employee.resources_needed,
            "status": "onboarding_started"
        }
        
        result = supabase.table("employees").insert(employee_data).execute()
        employee_id = result.data[0]["id"]
        
        # Генерування персонального плану
        personalized_plan = await generate_personalized_plan(
            employee.role,
            employee.department,
            employee.skills_required
        )
        
        # Створення завдань
        tasks = await create_onboarding_tasks(employee_id, employee.role)
        
        # Отримання ресурсів з Notion та DocuMinds
        org_domain = await extract_domain_from_email(employee.email)
        resources = await fetch_resources_from_notion(employee.role, org_domain)
        
        # Планування Q&A сесій
        qa_sessions = await schedule_qa_sessions(employee_id, employee.role)
        
        # Фонова задача: синхронізація з Jira (якщо потрібно)
        if employee.role in ["Frontend Developer", "Backend Developer", "DevOps Engineer"]:
            background_tasks.add_task(
                sync_with_jira,
                employee_id=employee_id,
                role=employee.role
            )
        
        return OnboardingPlanResponse(
            employee_id=employee_id,
            personalized_plan=personalized_plan,
            estimated_duration_days=personalized_plan.get("duration_days", 14),
            tasks=tasks,
            resources=resources,
            qa_sessions=qa_sessions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка створення плану онбордингу: {str(e)}")

@app.get("/api/v1/documinds/resources", tags=["documinds"], summary="📚 Отримання ресурсів з DocuMinds")
async def get_documinds_resources(
    organization_domain: str,
    integration_type: str = "notion",
    limit: int = 50
):
    """Отримання ресурсів з DocuMinds для конкретної організації"""
    
    try:
        # Знайдення організації по домену
        org_result = supabase.table("organizations")\
            .select("*")\
            .eq("domain", organization_domain)\
            .single()\
            .execute()
        
        if not org_result.data:
            raise HTTPException(status_code=404, detail="Організацію не знайдено")
        
        org_id = org_result.data["id"]
        
        # Знайдення інтеграції
        integration_result = supabase.table("integrations")\
            .select("*")\
            .eq("organization_id", org_id)\
            .eq("type", integration_type)\
            .execute()
        
        if not integration_result.data:
            return {
                "success": False,
                "message": f"Інтеграція {integration_type} не налаштована для організації",
                "resources": []
            }
        
        # Отримання ресурсів з інтеграції
        resources_result = supabase.table("resources")\
            .select("*")\
            .eq("organization_id", org_id)\
            .eq("integration_id", integration_result.data[0]["id"])\
            .eq("status", "active")\
            .limit(limit)\
            .execute()
        
        resources = []
        if resources_result.data:
            for resource in resources_result.data:
                resources.append(DocuMindsResource(
                    id=resource["id"],
                    name=resource["name"],
                    type=resource["type"],
                    url=resource.get("url"),
                    integration=integration_type,
                    last_synced_at=resource.get("last_synced_at")
                ))
        
        return {
            "success": True,
            "organization": organization_domain,
            "integration": integration_type,
            "resources_count": len(resources),
            "resources": resources
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка отримання ресурсів: {str(e)}")

@app.get("/api/v1/documinds/integrations", tags=["documinds"], summary="🔗 Список інтеграцій DocuMinds")
async def get_documinds_integrations(organization_domain: str):
    """Отримання доступних інтеграцій організації"""
    
    try:
        # Знайдення організації
        org_result = supabase.table("organizations")\
            .select("*")\
            .eq("domain", organization_domain)\
            .single()\
            .execute()
        
        if not org_result.data:
            raise HTTPException(status_code=404, detail="Організацію не знайдено")
        
        # Отримання інтеграцій
        integrations_result = supabase.table("integrations")\
            .select("*")\
            .eq("organization_id", org_result.data["id"])\
            .eq("status", "connected")\
            .execute()
        
        integrations = []
        if integrations_result.data:
            for integration in integrations_result.data:
                integrations.append(DocuMindsIntegration(
                    id=integration["id"],
                    name=integration["name"],
                    type=integration["type"],
                    status=integration["status"]
                ))
        
        return {
            "success": True,
            "organization": organization_domain,
            "integrations_count": len(integrations),
            "integrations": integrations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка отримання інтеграцій: {str(e)}")

@app.get("/api/v1/qa/answer", tags=["qa"], summary="💬 Q&A система")
async def get_qa_answer(question: str, role: str = "general"):
    """
    
    🧠 **Розумна Q&A система з векторним пошуком**
    
    Використовує векторизацію корпоративних знань та семантичний пошук для точних відповідей:
    
    1. **Семантичний пошук** в векторизованій базі знань
    2. **Контекстуальні відповіді** з використанням AI
    3. **Релевантні джерела** для кожній відповіді
    4. **Кешування** для швидкості відповіді
    
    ## Приклад використання:
    ```
    GET /api/v1/qa/answer?question=як_розпочати_роботу&role=Frontend Developer
    ```
    """
    
    try:
        # Кешування запитів в Redis
        cache_key = f"qa:{hash(question + role)}"
        cached_answer = redis_client.get(cache_key)
        
        if cached_answer:
            cached_data = json.loads(cached_answer)
            return QAResponse(
                question=question,
                answer=cached_data["answer"],
                confidence=cached_data["confidence"],
                sources=cached_data.get("sources", [])
            )
        
        answer_data = None
        
        # Використання векторного сервісу якщо доступний
        if vector_service:
            try:
                answer_data = await vector_service.get_contextual_answer(question, role)
                
                # Конвертація в QAResponse
                answer = QAResponse(
                    question=question,
                    answer=answer_data["answer"],
                    confidence=answer_data["confidence"],
                    sources=[source.get("content", source.get("type", "unknown")) for source in answer_data.get("sources", [])]
                )
            except Exception as e:
                print(f"Помилка векторного сервісу: {e}")
                answer_data = None
        
        # Fallback до старої системи
        if not answer_data:
            answer = await search_knowledge_base(question, role)
        else:
            # Кешування відповіді на 1 годину
            cache_data = {
                "answer": answer.answer,
                "confidence": answer.confidence,
                "sources": answer.sources
            }
            redis_client.setex(cache_key, 3600, json.dumps(cache_data))
        
        return answer
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка пошуку відповіді: {str(e)}")

@app.get("/api/v1/progress/{employee_id}", tags=["progress"], summary="📊 Отримання прогресу онбордингу")
async def get_onboarding_progress(employee_id: str):
    """Отримання прогесу онбордингу співробітника"""
    
    try:
        progress = supabase.table("onboarding_progress")\
            .select("*")\
            .eq("employee_id", employee_id)\
            .execute()
        
        if not progress.data:
            raise HTTPException(status_code=404, detail="Прогрес не знайдено")
        
        return progress.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка отримання прогресу: {str(e)}")

@app.post("/api/v1/progress/update", tags=["progress"], summary="✏️ Оновлення прогресу завдання")
async def update_task_progress(progress: TaskProgress):
    """Оновлення прогресу завдання"""
    
    try:
        update_data = {
            "status": progress.status,
            "progress_percentage": progress.progress_percentage,
            "notes": progress.notes,
            "updated_at": "now()"
        }
        
        result = supabase.table("onboarding_progress")\
            .update(update_data)\
            .eq("task_id", progress.task_id)\
            .eq("employee_id", progress.employee_id)\
            .execute()
        
        # Оновлення загального прогрес співробітника
        await calculate_overall_progress(progress.employee_id)
        
        return {"message": "Прогрес успішно оновлено", "data": result.data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка оновлення прогресу: {str(e)}")

# Векторізація та AI ендпоінти

@app.post("/api/v1/vectorization/start", tags=["vectorization"], summary="🚀 Запуск векторизації корпоративних знань")
async def start_vectorization():
    """
    🧠 **Автоматична векторизація корпоративних знань**
    
    Запускає процес витягнення та векторизації всієї корпоративної інформації:
    
    1. **Аналіз Supabase крааду** для отримання організацій, інтеграцій та ресурсів
    2. **Розбивка контенту** на chunks для кращого пошуку
    3. **Створення embeddings** через OpenAI
    4. **Збереження в Pinecone** для швидкого семантичного пошуку
    
    Процес може зайняти 5-15 хвилин залежно від обсягу даних.
    """
    
    if not vector_service:
        raise HTTPException(status_code=503, detail="Векторний сервіс недоступний. Перевірте конфігурацію OpenAI та Pinecone.")
    
    try:
        result = await vector_service.vectorize_corporate_knowledge()
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "message": "Векторизація повністю завершена!",
            "stats": result["stats"],
            "vector_index": vector_service.pinecone_index_name
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка векторизації: {str(e)}")

@app.get("/api/v1/vectorization/status", tags=["vectorization"], summary="📊 Статус векторизації")
async def get_vectorization_status():
    """
    📈 **Статус векторізації корпоративних знань**
    
    Показує поточний стан векторної бази знань:
    - Загальна кількість векторів
    - Розмірність embeddings
    - Статус індексу (готовий/порожній/помилка)
    - Час останнього оновлення
    """
    
    if not vector_service:
        return {
            "status": "unavailable",
            "error": "Векторний сервіс недоступний",
            "vector_service_configured": False
        }
    
    try:
        status = await vector_service.get_vectorization_status()
        
        return {
            "vector_service_configured": True,
            **status
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "vector_service_configured": True
        }

@app.post("/api/v1/vectorization/semantic-search", tags=["vectorization"], summary="🔍 Семантичний пошук")
async def semantic_search(query: str, limit: int = 5):
    """
    🔍 **Семантичний пошук по корпоративним знанням**
    
    Виконує векторний пошук по всій корпоративній базі знань:
    
    - **Контекстуальний пошук** замість точного співпадання текстів
    - **Релевантність на основі смислу**, а не ключових слів
    - **Впевненість (confidence score)** для кожного результату
    - **Метадані джерел** для перевірки достовірності
    """
    
    if not vector_service:
        raise HTTPException(status_code=503, detail="Векторний сервіс недоступний")
    
    try:
        results = await vector_service.semantic_search(query, limit=limit)
        
        return {
            "success": True,
            "query": query,
            "results_count": len(results),
            "results": results,
            "search_type": "semantic_vector",
            "vector_model": vector_service.embedding_model
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка семантичного пошуку: {str(e)}")

@app.get("/api/v1/ai/contextual-answer", tags=["ai-knowledge"], summary="🤖 AI-помічник з контекстом")
async def get_ai_answer(question: str, role: str = "general"):
    """
    🤖 **AI-помічник з контекстуальними відповідями**
    
    Найрозумніший ендпоінт для отримання відповідей нових співробітників:
    
    ## Як працює:
    1. **Семантичний пошук** в векторизованій базі знань
    2. **Контекстна аналітика** релевантного контенту
    3. **AI-генерація відповіді** з використанням GPT
    4. **Вказання джерел** та рівня довіри
    
    ## Переваги перед звичайним Q&A:
    - 🎯 **Контекстуальні відповіді** замість шаблонних
    - 📚 **Список джерел** для подальшого вивчення
    - 🎨 **Природні формулювання** мовою компанії
    - 🔍 **Глибиний аналіз** корпоративних процесів
    
    ## Приклади запитань:
    - "Як розпочати роботу як Frontend Developer?"
    - "Що таке код стайл в нашій компанії?"
    - "Які інструменті ми використовуємо для деплою?"
    """
    
    if not vector_service:
        raise HTTPException(status_code=503, detail="AI-помічник недоступний. Перевірте конфігурацію векторного сервісу.")
    
    try:
        result = await vector_service.get_contextual_answer(question, role)
        
        response_data = {
            "success": True,
            "question": question,
            "role_context": role,
            "answer": result["answer"],
            "confidence": result["confidence"],
            "context_found": result["context_found"],
            "sources": result.get("sources", []),
            "relevant_chunks": result.get("relevant_chunks", 0),
            "ai_model": "GPT-3.5-turbo + Semantic Search"
        }
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка AI-генерації відповіді: {str(e)}")

@app.get("/api/v1/ai/knowledge-summary", tags=["ai-knowledge"], summary="📋 Перегляд корпоративних знань")
async def get_knowledge_summary(role: str = None):
    """
    📋 **Перегляд структури корпоративних знань**
    
    Отримайте загальний вигляд екосистеми корпоративних знань:
    - Статистика по типам контенту
    - Доступні категорії знань
    - Актуальність інформації
    - Рекомендації для ролі
    """
    
    if not vector_service:
        raise HTTPException(status_code=503, detail="Сервіс знань недоступний")
    
    try:
        # Отримання статусу векторізації
        vector_status = await vector_service.get_vectorization_status()
        
        # Семантичний пошук по категоріях якщо вказано роль
        role_specific_content = []
        if role:
            test_queries = [
                f"onboarding process for {role}",
                f"technical stack for {role}",
                f"common tasks for {role}",
                f"team structure for {role}"
            ]
            
            for query in test_queries:
                try:
                    results = await vector_service.semantic_search(query, limit=2)
                    role_specific_content.extend(results)
                except:
                    pass
        
        return {
            "vector_status": vector_status,
            "knowledge_categories": [
                "organizations", "integrations", "resources",
                "onboarding_guides", "tech_stack", "processes"
            ],
            "role_specific_content": role_specific_content[:10] if role_specific_content else [],
            "total_vectors": vector_status.get("total_vectors", 0),
            "index_readiness": "ready" if vector_status.get("total_vectors", 0) > 0 else "empty"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка отримання перегляду знань: {str(e)}")

# Допоміжні функції

async def extract_domain_from_email(email: str) -> str:
    """Витягнення домену організації з email адреси"""
    try:
        domain = email.split('@')[1]
        return domain
    except (IndexError, AttributeError):
        return ""

async def generate_personalized_plan(role: str, department: str, skills: List[str]) -> Dict:
    """Генерація персонального плану онбордингу"""
    # Базовий план для ролі
    base_plans = {
        "Frontend Developer": {
            "duration_days": 14,
            "focus_areas": ["React", "TypeScript", "CSS", "Testing"],
            "mentor_assignment": True,
            "pair_programming_sessions": 5
        },
        "Backend Developer": {
            "duration_days": 16,
            "focus_areas": ["Python/Django", "APIs", "Database", "Testing"],
            "mentor_assignment": True,
            "code_review_sessions": 8
        },
        "Data Analyst": {
            "duration_days": 10,
            "focus_areas": ["SQL", "Python/Pandas", "BI Tools", "Statistics"],
            "mentor_assignment": True,
            "data_project_assignment": True
        }
    }
    
    return base_plans.get(role, {
        "duration_days": 14,
        "focus_areas": ["General"],
        "mentor_assignment": True
    })

async def create_onboarding_tasks(employee_id: str, role: str) -> List[Dict]:
    """Створення завдань для онбордингу"""
    task_templates = {
        "Frontend Developer": [
            {"title": "Налаштування IDE і робочого середовища", "duration": 1},
            {"title": "Setup проекту та встановлення залежностей", "duration": 2},
            {"title": "Ізучення кодубази та архітектури", "duration": 3},
            {"title": "Перше пулл-реквест з компонентом", "duration": 5}
        ],
        "Backend Developer": [
            {"title": "Налаштування локального сервера", "duration": 1},
            {"title": "Подключення до бази даних", "duration": 2},
            {"title": "Ізучення API архітектури", "duration": 3},
            {"title": "Створення першого ендпоінту", "duration": 7}
        ]
    }
    
    tasks = task_templates.get(role, [
        {"title": "Знайомство з компанією", "duration": 1},
        {"title": "Ознайомлення з процесами", "duration": 2},
        {"title": "Початкове навчання", "duration": 3}
    ])
    
    # Зберігання в базі даних
    for i, task in enumerate(tasks):
        task_data = {
            "employee_id": employee_id,
            "task_name": task["title"],
            "duration_days": task["duration"],
            "priority": "high" if i < 2 else "medium",
            "status": "pending"
        }
        supabase.table("onboarding_tasks").insert(task_data).execute()
    
    return tasks

async def fetch_resources_from_notion(role: str, org_domain: str = "") -> List[str]:
    """Отримання ресурсів з DocuMinds та Notion через MCP сервер"""
    
    resources = []
    
    # Спочатку спробуємо отримати з DocuMinds якщо є домен організації
    if org_domain:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"http://localhost:8000/api/v1/documinds/resources",
                    params={
                        "organization_domain": org_domain,
                        "integration_type": "notion",
                        "limit": 10
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        resources.extend([resource["name"] for resource in data.get("resources", [])])
        except Exception as e:
            print(f"Помилка отримання ресурсів з DocuMinds: {e}")
    
    # Якщо немає ресурсів з DocuMinds, спробуємо через MCP сервер
    if not resources:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{MCP_NOTION_HOST}/api/resources/role/{role}"
                )
                if response.status_code == 200:
                    resources.extend(response.json().get("resources", []))
        except Exception as e:
            print(f"Помилка отримання ресурсів з MCP Notion: {e}")
    
    # Fallback ресурси якщо нічого не отримали
    if not resources:
        resources = [
            "Документація компанії",
            "FAQ для початківців",
            "Гайдлайн по ролі"
        ]
    
    return resources

async def schedule_qa_sessions(employee_id: str, role: str) -> List[Dict]:
    """Планування Q&A сесій"""
    return [
        {
            "session_type": "one_on_one",
            "scheduled_for": "Day 3",
            "topics": ["Загальні питання", "Технічна адаптация"]
        },
        {
            "session_type": "team_introduction",
            "scheduled_for": "Day 5",
            "topics": ["Знайомство з командою"]
        }
    ]

async def sync_with_jira(employee_id: str, role: str):
    """Синхронізація з Jira через MCP сервер"""
    try:
        async with httpx.AsyncClient() as client:
            data = {
                "employee_id": employee_id,
                "role": role,
                "action": "create_onboarding_tasks"
            }
            await client.post(f"{MCP_JIRA_HOST}/api/jira/sync", json=data)
    except Exception as e:
        print(f"Помилка синхронізації з Jira: {e}")

async def search_knowledge_base(question: str, role: str) -> QAResponse:
    """Пошук в базі знань"""
    # Спрощений пошук - в реальному проекті буде використовуватися векторний пошук
    mock_answers = {
        "як розпочати роботу": {
            "answer": "Для старту роботи необхідно ознайомитися з базовими документами та пройти первинне налаштування середовища розробки.",
            "confidence": 0.95,
            "sources": ["Employee Handbook", "Getting Started Guide"]
        },
        "як працювати з git": {
            "answer": "Git використовується для версіонного контролю. Основні команди: git clone, git add, git commit, git push.",
            "confidence": 0.90,
            "sources": ["Git Guide", "Development Workflow"]
        }
    }
    
    question_lower = question.lower()
    for key, answer_data in mock_answers.items():
        if key in question_lower:
            return QAResponse(
                question=question,
                answer=answer_data["answer"],
                confidence=answer_data["confidence"],
                sources=answer_data["sources"]
            )
    
    return QAResponse(
        question=question,
        answer="Я не знайшов конкретної відповіді на ваше питання у базі знань. Будь ласка, зверніться до ментора або HR-спеціаліста.",
        confidence=0.30,
        sources=["General Knowledge Base"]
    )

async def calculate_overall_progress(employee_id: str):
    """Розрахунок загального прогрес онбордингу"""
    try:
        progress_data = supabase.table("onboarding_progress")\
            .select("*")\
            .eq("employee_id", employee_id)\
            .execute()
        
        if progress_data.data:
            total_tasks = len(progress_data.data)
            completed_tasks = len([task for task in progress_data.data if task["status"] == "completed"])
            overall_progress = int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
            
            # Оновлення загального прогрес в профілі співробітника
            supabase.table("employees")\
                .update({"overall_progress": overall_progress})\
                .eq("id", employee_id)\
                .execute()
                
    except Exception as e:
        print(f"Помилка розрахунку загального прогресу: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
