#!/usr/bin/env python3
"""
OnboardAI Vector Functionality Demo
Демонстрація векторизації корпоративних знань та AI-помічника
"""

import asyncio
import json
import httpx
from typing import Dict, List

class OnboardAIVectorDemo:
    """Демонстраційний клас для векторних функцій OnboardAI"""
    
    def __init__(self, api_base_url: str = "http://localhost:8000"):
        self.api_base_url = api_base_url
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def check_system_status(self) -> Dict:
        """Перевірка загального статусу системи"""
        print("🩺 Перевірка статусу системи...")
        
        try:
            response = await self.client.get(f"{self.api_base_url}/health")
            status = response.json()
            
            print(f"✅ Статус основного сервісу: {status['status']}")
            print(f"🗄️ Supabase: {status['supabase']}")
            print(f"⚡ Redis: {status['redis']}")
            
            return status
            
        except Exception as e:
            print(f"❌ Помилка перевірки статусу: {e}")
            return {"error": str(e)}
    
    async def check_vector_service_status(self) -> Dict:
        """Перевірка статусу векторного сервісу"""
        print("\n🧠 Перевірка статусу векторного сервісу...")
        
        try:
            response = await self.client.get(f"{self.api_base_url}/api/v1/vectorization/status")
            status = response.json()
            
            if "vector_service_configured" in status:
                print(f"✅ Векторний сервіс налаштований: {status['vector_service_configured']}")
                
                if status.get("status") == "ready":
                    if status.get("total_vectors", 0) > 0:
                        print(f"🎯 Total vectors: {status['total_vectors']}")
                        print(f"📏 Dimension: {status['dimension']}")
                    else:
                        print("⚠️ Векторна база порожня")
                elif status.get("status") == "unavailable":
                    print("⚠️ Векторний сервіс недоступний (потрібно налаштувати ключі)")
            else:
                print("❌ Векторний сервіс не налаштований")
            
            return status
            
        except Exception as e:
            print(f"❌ Помилка перевірки векторного сервісу: {e}")
            return {"error": str(e)}
    
    async def start_vectorization_process(self) -> Dict:
        """Запуск процесу векторизації (DEMO версія - без реальних даних)"""
        print("\n🚀 Запуск процесу векторизації корпоративних знань...")
        print("📝 Це DEMO версія - для повної роботи потрібні ключі OpenAI та Pinecone")
        
        try:
            # Демонстрація того, що буде відбуватися
            print("\n📋 Етапи векторизації:")
            print("1. 🔍 Аналіз Supabase схеми DocuMinds")
            print("2. 📚 Витягнення організацій, інтеграцій та ресурсів")
            print("3. ✂️ Розбивка контенту на chunks (1000 символів)")
            print("4. 🧠 Створення embeddings через OpenAI text-embedding-3-large")
            print("5. 🗄️ Збереження векторів в Pinecone (3072 розмірності)")
            print("6. ✅ Готово для семантичного пошуку!")
            
            demo_result = {
                "success": True,
                "message": "Демонстрація процесу векторизації завершена",
                "demo_mode": True,
                "would_process": {
                    "organizations": "Домен companies, план та статус",
                    "integrations": "Notion, Jira, Confluence налаштування",
                    "resources": "Документи, таблиці, странічки",
                    "knowledge_base": "Базова документація та процеси"
                },
                "estimated_chunks": "50-200 chunks",
                "estimated_vectors": "3072 розмірності кожен",
                "storage": "Pinecone vector database"
            }
            
            return demo_result
            
        except Exception as e:
            print(f"❌ Помилка демонстрації векторизації: {e}")
            return {"error": str(e)}
    
    async def demo_semantic_search(self) -> Dict:
        """Демонстрація семантичного пошуку"""
        print("\n🔍 Демонстрація семантичного пошуку...")
        
        demo_queries = [
            "як розпочати роботу як фронтенд розробник",
            "процес код рев'ю в компанії",
            "технічний стек для backend розробки",
            "інтеграція з notion та jira"
        ]
        
        results = []
        
        for query in demo_queries:
            print(f"\n🔎 Запит: '{query}'")
            
            try:
                # Симуляція семантичного пошуку
                demo_result = {
                    "query": query,
                    "semantic_results": [
                        {
                            "content": f"Відповідний контент для запиту '{query}' з корпоративної бази знань",
                            "similarity_score": 0.85,
                            "source": "company_documentation",
                            "type": "onboarding_guide"
                        },
                        {
                            "content": f"Релевантна інформація про процеси для '{query}'",
                            "similarity_score": 0.72,
                            "source": "internal_wiki",
                            "type": "process_documentation"
                        }
                    ],
                    "search_type": "semantic_vector",
                    "confidence": "high"
                }
                
                results.append(demo_result)
                print(f"✅ Знайдено {len(demo_result['semantic_results'])} релевантних результатів")
                
            except Exception as e:
                print(f"❌ Помилка семантичного пошуку: {e}")
        
        return {
            "success": True,
            "demo_queries": len(demo_queries),
            "total_results": sum(len(r.get("semantic_results", [])) for r in results),
            "example_results": results
        }
    
    async def demo_ai_assistant(self) -> Dict:
        """Демонстрація AI-помічника"""
        print("\n🤖 Демонстрація AI-помічника з контекстуальними відповідями...")
        
        demo_questions = [
            {
                "question": "Як розпочати роботу як Frontend Developer?",
                "role": "Frontend Developer",
                "expected_response": "Детальний план першого тижня з налаштуванням середовища"
            },
            {
                "question": "Що таке код стайл в нашій компанії?",
                "role": "general",
                "expected_response": "Гайдлайн з форматування, номенклатурою та структурою коду"
            },
            {
                "question": "Які інструменті ми використовуємо для деплою?",
                "role": "DevOps Engineer",
                "expected_response": "Docker, Kubernetes, AWS конфігурація та CI/CD"
            }
        ]
        
        ai_responses = []
        
        for qa in demo_questions:
            print(f"\n❓ Питання: {qa['question']}")
            print(f"👤 Роль: {qa['role']}")
            
            try:
                # Симуляція AI відповіді з використанням векторного пошуку
                demo_response = {
                    "question": qa["question"],
                    "role_context": qa["role"],
                    "ai_answer": f"""
🤖 AI-генерована відповідь з контекстом:

{qa['expected_response']}

**Алгоритм генерації:**
1. 🔍 Семантичний пошук по корпоративній базі знань
2. 📚 Витягнення релевантних chunks з Pinecone  
3. 🧠 Аналіз контексту з GPT-3.5-turbo
4. 📝 Формулювання відповіді специфічно для ролі "{qa['role']}"
5. 📊 Визначення рівня довіри та джерел

**Переваги перед обычними Q&A:**
✅ Контекстуальні відповіді замість шаблонних
✅ Врахування ролі користувача
✅ Посилання на конкретні джерела
✅ Щоденне оновлення через моніторинг Supabase
                    """,
                    "confidence": 0.88,
                    "context_found": True,
                    "sources": [
                        {"source": "company_onboarding_guide", "relevance": 0.92},
                        {"source": "team_processes", "relevance": 0.85},
                        {"source": "tech_documentation", "relevance": 0.78}
                    ],
                    "ai_model": "GPT-3.5-turbo + Semantic Search",
                    "vector_search_performed": True
                }
                
                ai_responses.append(demo_response)
                print(f"✅ AI відповідь згенерована (довіра: {demo_response['confidence']:.1%})")
                
            except Exception as e:
                print(f"❌ Помилка генерації AI відповіді: {e}")
        
        return {
            "success": True,
            "total_questions": len(demo_questions),
            "ai_responses": ai_responses,
            "demo_features": [
                "Семантичний пошук корпоративних знань",
                "Контекстуальна генерація з AI",
                "Врахування ролі користувача",
                "Вказання джерел та довіри",
                "Інтеграція з DocuMinds та Notion"
            ]
        }
    
    async def demo_knowledge_integration(self) -> Dict:
        """Демонстрація інтеграції з корпоративними системами"""
        print("\n🔗 Демонстрація інтеграції з корпоративними системами...")
        
        # Демонстрація DocuMinds інтеграції
        print("\n📋 DocuMinds Integration:")
        try:
            response = await self.client.get(
                f"{self.api_base_url}/api/v1/documinds/resources",
                params={
                    "organization_domain": "demo.com",
                    "integration_type": "notion",
                    "limit": 5
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ DocuMinds ресурси: {data.get('resources_count', 0)} знайдено")
            else:
                print("⚠️ DocuMinds ресурси недоступні (порожня база)")
                
        except Exception as e:
            print(f"❌ Помилка DocuMinds: {e}")
        
        # Симуляція векторизації корпоративної інформації  
        demo_integration = {
            "documinds_extraction": {
                "organizations": "Домен companies та структури",
                "integrations": "Налаштування Notion, Jira, Confluence", 
                "resources": "Документи та странічки колиджу",
                "groups_permissions": "Права доступу та ролі"
            },
            "vectorization_plan": [
                "📊 Структури дані Supabase схеми",
                "✂️ Text chunking (1000 симв/100 overlap)",
                "🧠 OpenAI embeddings (text-embedding-3-large)",
                "🗄️ Pinecone vector storage",
                "🔄 Auto-reindex при змінах"
            ],
            "search_capabilities": [
                "🎯 Семантичний пошук за змістом",
                "🏢 Пошук по організації",
                "👤 Категоризація по ролях",
                "📅 Часові зміни та актуальність",
                "🔍 Хрест-референси між системами"
            ]
        }
        
        print("\n🎯 Можливості інтеграції:")
        for category, items in demo_integration.items():
            print(f"\n{category.replace('_', ' ').title()}:")
            if isinstance(items, list):
                for item in items:
                    print(f"  {item}")
            else:
                for key, value in items.items():
                    print(f"  {key}: {value}")
        
        return demo_integration
    
    async def run_full_demo(self):
        """Запуск повної демонстрації векторних можливостей"""
        print("🚀 OnboardAI Vector Functionality Demo")
        print("=" * 50)
        
        # 1. Статус системи
        await self.check_system_status()
        
        # 2. Векторний сервіс 
        await self.check_vector_service_status()
        
        # 3. Процес векторизації
        await self.start_vectorization_process()
        
        # 4. Семантичний пошук
        await self.demo_semantic_search()
        
        # 5. AI-помічник
        await self.demo_ai_assistant()
        
        # 6. Корпоративна інтеграція
        await self.demo_knowledge_integration()
        
        print("\n🎉 Демонстрація завершена!")
        print("\n📋 Наступні кроки для production:")
        print("1. 🔑 Налаштуйте OPENAI_API_KEY")
        print("2. 🗄️ Налаштуйте PINECONE_API_KEY")
        print("3. 📚 Запустіть /api/v1/vectorization/start")
        print("4. 🤖 Використовуйте /api/v1/ai/contextual-answer")
        print("5. 🔍 Тестуйте /api/v1/vectorization/semantic-search")
        
        await self.client.aclose()

async def main():
    """Запуск демонстрації"""
    demo = OnboardAIVectorDemo()
    await demo.run_full_demo()

if __name__ == "__main__":
    asyncio.run(main())
