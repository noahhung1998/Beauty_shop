#!/bin/bash
# ============================================================
# Beauty Shop - One-click startup script
# Run with: ./start.sh
# ============================================================

set -e

PROJECT_DIR="/Users/a080528/Desktop/Github/Beauty_shop"
cd "$PROJECT_DIR"

echo "🚀 Starting Beauty Shop..."
echo ""

# 1. Start Redis if not running
if ! pgrep -x "redis-server" > /dev/null; then
  echo "📦 Starting Redis..."
  brew services start redis
fi

# 2. Start PostgreSQL if not running
if ! pg_isready -q 2>/dev/null; then
  echo "🐘 Starting PostgreSQL..."
  brew services start postgresql@14
  sleep 2
fi

# 3. Kill any existing processes on ports 8000 and 3000
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 4. Start backend (FastAPI)
echo "🔧 Starting backend on http://localhost:8000 ..."
cd "$PROJECT_DIR/backend"
DATABASE_URL="postgresql+asyncpg://a080528@localhost:5432/beautyshop" \
ALLOWED_ORIGINS='["http://localhost:3000"]' \
SECRET_KEY="dev-secret-key" \
nohup .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/beautyshop-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# 5. Wait for backend to be ready
sleep 3
if curl -sf http://localhost:8000/health > /dev/null; then
  echo "   ✅ Backend is healthy"
else
  echo "   ⚠️  Backend not responding yet, check /tmp/beautyshop-backend.log"
fi

# 6. Start frontend (Next.js)
echo "🎨 Starting frontend on http://localhost:3000 ..."
cd "$PROJECT_DIR/frontend"
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1" \
nohup npx next dev --port 3000 > /tmp/beautyshop-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

sleep 5
if curl -sf -o /dev/null http://localhost:3000; then
  echo "   ✅ Frontend is ready"
else
  echo "   ⚠️  Frontend still starting, check /tmp/beautyshop-frontend.log"
fi

echo ""
echo "🎉 Beauty Shop is running!"
echo ""
echo "   🛍️  Storefront:  http://localhost:3000"
echo "   🛠  Admin:       http://localhost:3000/admin"
echo "   📚 API Docs:    http://localhost:8000/docs"
echo ""
echo "   Test accounts:"
echo "     - admin@beautyshop.es / admin123"
echo "     - cliente@test.es / test123"
echo ""
echo "   Logs:"
echo "     tail -f /tmp/beautyshop-backend.log"
echo "     tail -f /tmp/beautyshop-frontend.log"
echo ""
echo "   To stop everything: ./stop.sh"
