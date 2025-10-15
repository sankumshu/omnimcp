#!/bin/bash
# Stop OmniMCP Platform Servers

echo "🛑 Stopping OmniMCP Platform..."

# Kill servers on ports
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ Backend stopped" || echo "⚠️  Backend not running"
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "✅ Frontend stopped" || echo "⚠️  Frontend not running"

echo ""
echo "✅ All servers stopped"
