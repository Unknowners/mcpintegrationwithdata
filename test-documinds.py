#!/usr/bin/env python3
"""
Тестовий скрипт для перевірки з'єднання з DocuMinds Supabase
"""

import os
from supabase import create_client, Client

# Конфігурація DocuMinds
SUPABASE_URL = "https://rbmepcfznvcskxayuisp.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWVwY2Z6bnZjc2t4YXl1aXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjUzOTAsImV4cCI6MjA3NTAwMTM5MH0.ia2D4eT_VpqKApv4pdgTvHsvOCyR_XoCra73j2ElI9Y"

def test_supabase_connection():
    try:
        print("🔗 Тестування з'єднання з DocuMinds Supabase...")
        
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print(f"✅ Supabase клієнт створено для: {SUPABASE_URL}")
        
        # Тест списку таблиць через інформаційну схему
        print("\n📊 Перевірка доступних таблиць...")
        
        # Спрощений запит до info_schema щоб побачити структуру
        try:
            # Спроба прочитати організації
            result = supabase.table("organizations").select("id, name, domain").limit(5).execute()
            if result.data:
                print(f"✅ Таблиця 'organizations' доступна ({len(result.data)} записів)")
                for org in result.data:
                    print(f"   - {org['name']} ({org.get('domain', 'No domain')})")
            else:
                print("ℹ️  Таблиця 'organizations' порожня або недоступна")
                
        except Exception as e:
            print(f"⚠️  Помилка доступу до таблиці organizations: {e}")
        
        # Тест інтеграцій
        try:
            result = supabase.table("integrations").select("id, name, type, status").limit(5).execute()
            if result.data:
                print(f"\n✅ Таблиця 'integrations' доступна ({len(result.data)} записів)")
                for integration in result.data:
                    print(f"   - {integration['name']} ({integration['type']}) - {integration['status']}")
            else:
                print("\nℹ️  Таблиця 'integrations' порожня або недоступна")
                
        except Exception as e:
            print(f"\n⚠️  Помилка доступу до таблиці integrations: {e}")
        
        # Тест ресурсів
        try:
            result = supabase.table("resources").select("id, name, type, integration").limit(5).execute()
            if result.data:
                print(f"\n✅ Таблиця 'resources' доступна ({len(result.data)} записів)")
                for resource in result.data:
                    print(f"   - {resource['name']} ({resource['type']}) - {resource.get('integration', 'Unknown')}")
            else:
                print("\nℹ️  Таблиця 'resources' порожня або недоступна")
                
        except Exception as e:
            print(f"\n⚠️  Помилка доступу до таблиці resources: {e}")
        
        print("\n🎉 Тестування завершено!")
        return True
        
    except Exception as e:
        print(f"❌ Помилка підключення до Supabase: {e}")
        return False

if __name__ == "__main__":
    test_supabase_connection()
