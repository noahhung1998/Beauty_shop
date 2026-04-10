#!/bin/bash
# ============================================================
# Beauty Shop - Stop all services
# Run with: ./stop.sh
# ============================================================

echo "🛑 Stopping Beauty Shop..."

if lsof -ti:8000 > /dev/null 2>&1; then
  lsof -ti:8000 | xargs kill -9
  echo "   ✅ Backend stopped"
else
  echo "   ℹ️  Backend was not running"
fi

if lsof -ti:3000 > /dev/null 2>&1; then
  lsof -ti:3000 | xargs kill -9
  echo "   ✅ Frontend stopped"
else
  echo "   ℹ️  Frontend was not running"
fi

echo ""
echo "Note: PostgreSQL and Redis are still running as system services."
echo "If you want to stop them too, run:"
echo "  brew services stop postgresql@14"
echo "  brew services stop redis"
