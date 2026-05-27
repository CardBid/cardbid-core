FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY . .

WORKDIR /app/backend

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD daphne -b 0.0.0.0 -p ${PORT:-8000} core.asgi:application