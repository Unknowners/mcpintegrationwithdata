"""
OnboardAI Vector Service - Векторизація корпоративної інформації та семантичний пошук
"""

import os
import json
import asyncio
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import logging

import numpy as np
import pandas as pd
from pinecone import Pinecone, ServerlessSpec
from openai import AsyncOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from supabase import create_client, Client
import redis
import httpx

# Логування
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorService:
    """Сервіс для векторізації та семантичного пошуку корпоративної інформації"""
    
    def __init__(self):
        # Конфігурація
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY")
        self.pinecone_environment = os.getenv("PINECONE_ENVIRONMENT", "us-east-1-aws")
        self.pinecone_index_name = os.getenv("PINECONE_INDEX_NAME", "onboardai-knowledge")
        
        # Параметри векторізації
        self.embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-large")
        self.chunk_size = int(os.getenv("CHUNK_SIZE", "1000"))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", "200"))
        self.max_tokens = int(os.getenv("MAX_TOKENS", "4000"))
        
        # Ініціалізація клієнтів
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        self.redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        self.openai_client = AsyncOpenAI(api_key=self.openai_api_key)
        
        # Ініціалізація Pinecone
        self.pc = Pinecone(api_key=self.pinecone_api_key)
        self.index = None
        
        # Ініціалізація text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", "。"],
        )
    
    async def initialize_index(self):
        """Ініціалізація Pinecone індексу"""
        try:
            # Перевіряємо чи існує індекс
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if self.pinecone_index_name not in existing_indexes:
                logger.info(f"Створюємо новий Pinecone індекс: {self.pinecone_index_name}")
                
                self.pc.create_index(
                    name=self.pinecone_index_name,
                    dimension=3072,  # text-embedding-3-large має 3072 розмірності
                    metric='cosine',
                    spec=ServerlessSpec(
                        cloud='aws',
                        region=self.pinecone_environment
                    )
                )
                
                # Чекаємо поки індекс буде готовий
                await asyncio.sleep(10)
            
            self.index = self.pc.Index(self.pinecone_index_name)
            logger.info(f"Pinecone індекс {self.pinecone_index_name} готовий!")
            return True
            
        except Exception as e:
            logger.error(f"Помилка ініціалізації Pinecone: {e}")
            return False
    
    async def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Створення embeddings для списку текстів"""
        try:
            response = await self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=texts,
                encoding_format="float"
            )
            
            return [embedding.embedding for embedding in response.data]
            
        except Exception as e:
            logger.error(f"Помилка створення embeddings: {e}")
            return []
    
    def chunk_document(self, content: str, metadata: Dict = None) -> List[Document]:
        """Розбивка документа на chunks"""
        try:
            documents = self.text_splitter.create_documents(
                texts=[content],
                metadatas=[metadata or {}]
            )
            
            logger.info(f"Документ розбито на {len(documents)} chunks")
            return documents
            
        except Exception as e:
            logger.error(f"Помилка розбивки документа: {e}")
            return []
    
    async def analyze_supabase_schema(self) -> Dict[str, any]:
        """Аналіз схеми Supabase для отримання інформації про структуру"""
        try:
            schema_info = {
                "organizations": [],
                "integrations": [],
                "resources": [],
                "knowledge_items": [],
                "total_records": 0
            }
            
            # Аналіз організацій
            orgs_result = self.supabase.table("organizations").select("*").limit(100).execute()
            if orgs_result.data:
                schema_info["organizations"] = orgs_result.data
                schema_info["total_records"] += len(orgs_result.data)
            
            # Аналіз інтеграцій
            integrations_result = self.supabase.table("integrations").select("*").limit(100).execute()
            if integrations_result.data:
                schema_info["integrations"] = integrations_result.data
                schema_info["total_records"] += len(integrations_result.data)
            
            # Аналіз ресурсів
            resources_result = self.supabase.table("resources").select("*").limit(100).execute()
            if resources_result.data:
                schema_info["resources"] = resources_result.data
                schema_info["total_records"] += len(resources_result.data)
            
            logger.info(f"Проаналізовано {schema_info['total_records']} записів з Supabase")
            return schema_info
            
        except Exception as e:
            logger.error(f"Помилка аналізу схеми Supabase: {e}")
            return {"error": str(e)}
    
    async def extract_corporate_knowledge(self) -> List[Dict]:
        """Витягнення корпоративних знань з різних джерел"""
        knowledge_items = []
        
        try:
            # Отримуємо схему
            schema_info = await self.analyze_supabase_schema()
            
            # Обработка організацій
            for org in schema_info.get("organizations", []):
                org_content = f"""
                Організація: {org.get('name', 'Без назви')}
                Домен: {org.get('domain', 'Не вказано')}
                План: {org.get('plan', 'Не вказано')}
                Статус: {org.get('status', 'Не вказано')}
                Створено: {org.get('created_at', 'Не вказано')}
                """
                
                knowledge_items.append({
                    "content": org_content,
                    "metadata": {
                        "type": "organization",
                        "source": "supabase",
                        "table": "organizations",
                        "id": org.get("id"),
                        "name": org.get("name"),
                        "domain": org.get("domain"),
                        "extracted_at": datetime.now().isoformat()
                    }
                })
            
            # Обработка інтеграцій
            for integration in schema_info.get("integrations", []):
                integration_content = f"""
                Інтеграція: {integration.get('name', 'Без назви')}
                Тип: {integration.get('type', 'Не вказано')}
                Статус: {integration.get('status', 'Не вказано')}
                Тип авторизації: {integration.get('auth_type', 'Не вказано')}
                Остання синхронізація: {integration.get('last_sync_at', 'Не вказано')}
                """
                
                knowledge_items.append({
                    "content": integration_content,
                    "metadata": {
                        "type": "integration",
                        "source": "supabase",
                        "table": "integrations",
                        "id": integration.get("id"),
                        "name": integration.get("name"),
                        "type": integration.get("type"),
                        "extracted_at": datetime.now().isoformat()
                    }
                })
            
            # Обработка ресурсів
            for resource in schema_info.get("resources", []):
                resource_content = f"""
                Ресурс: {resource.get('name', 'Без назви')}
                Тип: {resource.get('type', 'Не вказано')}
                Статус: {resource.get('status', 'Не вказано')}
                URL: {resource.get('url', 'Не вказано')}
                Остання синхронізація: {resource.get('last_synced_at', 'Не вказано')}
                """
                
                knowledge_items.append({
                    "content": resource_content,
                    "metadata": {
                        "type": "resource",
                        "source": "supabase",
                        "table": "resources",
                        "id": resource.get("id"),
                        "name": resource.get("name"),
                        "resource_type": resource.get("type"),
                        "extracted_at": datetime.now().isoformat()
                    }
                })
            
            # Додаємо базові корпоративні знання
            basic_knowledge = self._get_basic_knowledge_items()
            knowledge_items.extend(basic_knowledge)
            
            logger.info(f"Витягнуто {len(knowledge_items)} елементів корпоративних знань")
            return knowledge_items
            
        except Exception as e:
            logger.error(f"Помилка витягнення корпоративних знань: {e}")
            return []
    
    def _get_basic_knowledge_items(self) -> List[Dict]:
        """Базові корпоративні знання для нового співробітника"""
        return [
            {
                "content": """
                Процес онбордингу в компанії:
                1. Перший день - ознайомлення з командою та процесами
                2. Тиждень 1 - налаштування середовища розробки
                3. Тиждень 2 - поглиблене вивчення архітектури продукту
                4. Тиждень 3-4 - перший проект та code review
                """,
                "metadata": {
                    "type": "onboarding_guide",
                    "source": "system",
                    "category": "process",
                    "extracted_at": datetime.now().isoformat()
                }
            },
            {
                "content": """
                Технічний стек компанії:
                - Frontend: React, TypeScript, Next.js
                - Backend: Python, FastAPI, PostgreSQL
                - Deploy: Docker, Kubernetes, AWS
                - Документація: Notion, Confluence
                - Задачі: Jira, Linear
                """,
                "metadata": {
                    "type": "tech_stack",
                    "source": "system",
                    "category": "technology",
                    "extracted_at": datetime.now().isoformat()
                }
            },
            {
                "content": """
                Код рев'ю процес:
                1. Створення pull request з детальним описом змін
                2. Автоматичне тестування та CI/CD перевірка
                3. Мінімум 2 апруви від сеорніор розробників
                4. Вирішення коментарів та merge до main
                """,
                "metadata": {
                    "type": "code_review",
                    "source": "system",
                    "category": "process",
                    "extracted_at": datetime.now().isoformat()
                }
            }
        ]
    
    async def vectorize_corporate_knowledge(self) -> Dict[str, any]:
        """Головна функціЯ векторизації корпоративних знань"""
        try:
            logger.info("Початок векторизації корпоративних знань...")
            
            # Ініціалізація індексу
            if not await self.initialize_index():
                return {"error": "Не вдалося ініціалізувати Pinecone"}
            
            # Витягнення знань
            knowledge_items = await self.extract_corporate_knowledge()
            
            if not knowledge_items:
                return {"error": "Не знайдено корпоративних знань для векторизації"}
            
            # Обробка кожного елемента знань
            processed_chunks = []
            
            for i, item in enumerate(knowledge_items):
                # Розбивка на chunks
                chunks = self.chunk_document(item["content"], item["metadata"])
                
                for chunk_idx, chunk in enumerate(chunks):
                    chunk_id = f"chunk_{i}_{chunk_idx}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    
                    processed_chunks.append({
                        "id": chunk_id,
                        "content": chunk.page_content,
                        "metadata": chunk.metadata
                    })
            
            # Створення embeddings
            logger.info(f"Створення embeddings для {len(processed_chunks)} chunks...")
            texts = [chunk["content"] for chunk in processed_chunks]
            embeddings = await self.create_embeddings(texts)
            
            # Підготовка даних для Pinecone
            vectors_to_upsert = []
            for i, (chunk, embedding) in enumerate(zip(processed_chunks, embeddings)):
                vectors_to_upsert.append({
                    "id": chunk["id"],
                    "values": embedding,
                    "metadata": chunk["metadata"]
                })
            
            # Завантаження в Pinecone (батчами)
            batch_size = 100
            for i in range(0, len(vectors_to_upsert), batch_size):
                batch = vectors_to_upsert[i:i + batch_size]
                self.index.upsert(vectors=batch)
                logger.info(f"Завантажено batch {i//batch_size + 1}/{(len(vectors_to_upsert) + batch_size - 1)//batch_size}")
            
            # Оновлення кешу
            cache_key = "vectorization_stats"
            stats = {
                "total_chunks": len(processed_chunks),
                "vectors_stored": len(vectors_to_upsert),
                "knowledge_items": len(knowledge_items),
                "timestamp": datetime.now().isoformat()
            }
            self.redis_client.setex(cache_key, 3600, json.dumps(stats))
            
            logger.info(f"Векторизація завершена! Процесовано {len(processed_chunks)} chunks")
            
            return {
                "success": True,
                "stats": stats,
                "message": "Корпоративні знання успішно векторизовані!"
            }
            
        except Exception as e:
            logger.error(f"Помилка векторизації: {e}")
            return {"error": str(e)}
    
    async def semantic_search(self, query: str, role: str = None, limit: int = 5) -> List[Dict]:
        """Семантичний пошук по корпоративним знанням"""
        try:
            if not self.index:
                await self.initialize_index()
            
            # Створення embedding для запиту
            query_embedding = await self.create_embeddings([query])
            if not query_embedding:
                return []
            
            # Семантичний пошук
            search_results = self.index.query(
                vector=query_embedding[0],
                top_k=limit,
                include_metadata=True
            )
            
            # Обробка результатів
            results = []
            for match in search_results.matches:
                result = {
                    "content": match.metadata.get("content", ""),
                    "metadata": match.metadata,
                    "similarity_score": match.score,
                    "relevance": "high" if match.score > 0.8 else "medium" if match.score > 0.6 else "low"
                }
                results.append(result)
            
            logger.info(f"Знайдено {len(results)} релевантних результатів для запиту: '{query}'")
            return results
            
        except Exception as e:
            logger.error(f"Помилка семантичного пошуку: {e}")
            return []
    
    async def get_contextual_answer(self, question: str, role: str = "general") -> Dict:
        """Отримання контекстуальної відповіді з використанням векторного пошуку"""
        try:
            # Пошук релевантного контенту
            semantic_results = await self.semantic_search(question, role, limit=3)
            
            if not semantic_results:
                return {
                    "answer": "Я не знайшов відповіді на ваше запитання у корпоративній базі знань. Будь ласка, зверніться до ментора або HR-спеціаліста.",
                    "confidence": 0.2,
                    "sources": [],
                    "context_found": False
                }
            
            # Підготовка контексту для LLM
            context_chunks = []
            sources = []
            
            for result in semantic_results:
                if result["similarity_score"] > 0.6:  # Фільтрація по релевантності
                    context_chunks.append(result["content"])
                    sources.append({
                        "content": result["metadata"].get("content", "")[:200] + "...",
                        "source": result["metadata"].get("source", "unknown"),
                        "type": result["metadata"].get("type", "unknown"),
                        "similarity": result["similarity_score"]
                    })
            
            if not context_chunks:
                return {
                    "answer": "Знайшов релевантну інформацію, але вона має низький рівень довіри. Рекомендую звернутися до ментора за уточненням.",
                    "confidence": 0.4,
                    "sources": sources,
                    "context_found": True
                }
            
            # Генерація відповіді з контекстом
            context_text = "\n\n".join(context_chunks)
            
            prompt = f"""
            Ви — AI-помічник для нових співробітників компанії. 
            Відповідайте на запитання користувача на основі наданого контексту корпоративних знань.
            
            Контекст: {context_text}
            
            Запитання користувача: {question}
            Роль користувача: {role}
            
            Дайте чітку, користну відповідь на основі контексту. Якщо в контексті недостатньо інформації, поясніть що саме потрібно уточнеиня.
            Відповідь має бути українською мовою.
            """
            
            # Використання OpenAI для генерації відповіді
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=self.max_tokens,
                temperature=0.7
            )
            
            answer = response.choices[0].message.content
            confidence = sum([r["similarity_score"] for r in semantic_results]) / len(semantic_results)
            
            return {
                "answer": answer,
                "confidence": confidence,
                "sources": sources,
                "context_found": True,
                "relevant_chunks": len(context_chunks)
            }
            
        except Exception as e:
            logger.error(f"Помилка генерації контекстуальної відповіді: {e}")
            return {
                "answer": f"Виникла помилка при обробці запитання: {str(e)}",
                "confidence": 0.1,
                "sources": [],
                "context_found": False
            }
    
    async def get_vectorization_status(self) -> Dict:
        """Отримання статусу векторизації"""
        try:
            # Перевірка кешу
            cache_key = "vectorization_stats"
            cached_stats = self.redis_client.get(cache_key)
            
            if cached_stats:
                return json.loads(cached_stats)
            
            # Перевірка індексу
            if not self.index:
                await self.initialize_index()
            
            stats = self.index.describe_index_stats()
            
            return {
                "index_name": self.pinecone_index_name,
                "total_vectors": stats.total_vector_count,
                "dimension": stats.dimension,
                "last_index_update": datetime.now().isoformat(),
                "status": "ready" if stats.total_vector_count > 0 else "empty"
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "error"
            }
