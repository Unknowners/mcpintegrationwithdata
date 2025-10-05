FROM python:3.11-slim

WORKDIR /app

# Встановлення системних залежностей
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Копіювання та встановлення Python залежностей
COPY onboardai-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіювання коду додатку
COPY onboardai-api/ .

# Відкривання порту
EXPOSE 8000

# Команда запуску (без reload для production)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
