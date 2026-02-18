#!/bin/bash
# run_free_tier.sh

echo "🌱 Seeding Database..."
python scripts/bootstrap.py

echo "🚀 Starting Celery Worker (Background)..."
celery -A app.core.celery_app worker --loglevel=info --concurrency=1 &

# echo "🚀 Starting Celery Beat (Background)..."
# celery -A app.core.celery_app beat --loglevel=warning &

echo "✅ Starting FastAPI Server (Optimized)..."
uvicorn app.main:app --host 0.0.0.0 --port $PORT --limit-concurrency 20 --timeout-keep-alive 15
