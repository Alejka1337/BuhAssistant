FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости для Python и Playwright
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    wget \
    gnupg \
    # Playwright dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Копируем requirements.txt
COPY requirements.txt .

# Устанавливаем Python зависимости
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем весь код приложения
COPY . .

# Создаем non-root пользователя
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Переключаемся на пользователя appuser
USER appuser

# Устанавливаем Playwright browsers для appuser
RUN playwright install chromium

# Устанавливаем переменную окружения для Playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/home/appuser/.cache/ms-playwright

# Открываем порт 8000
EXPOSE 8000

# Команда по умолчанию (может быть переопределена в docker-compose.yml)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

