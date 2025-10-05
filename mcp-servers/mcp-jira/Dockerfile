FROM node:18-alpine

WORKDIR /app

# Копіювання package.json та встановлення залежностей
COPY package*.json ./
RUN npm ci --only=production

# Копіювання вихідного коду
COPY . .

# Відкривання порту
EXPOSE 3001

# Команда запуску
CMD ["node", "index.js"]
