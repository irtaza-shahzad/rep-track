FROM python:3.11-slim

WORKDIR /app

# Install system deps needed by psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# On startup: create schema (if fresh) then start the server
CMD ["sh", "-c", "python scripts/init_db.py && uvicorn main:app --host 0.0.0.0 --port 8000"]
