#!/bin/bash

# Mulina - Stop Script
# Zatrzymuje backend i frontend

echo "🛑 Stopping Mulina Application..."

# Kill by PID files
if [ -f /tmp/mulina_backend.pid ]; then
    BACKEND_PID=$(cat /tmp/mulina_backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "✅ Backend stopped (PID: $BACKEND_PID)"
    rm /tmp/mulina_backend.pid
fi

if [ -f /tmp/mulina_frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/mulina_frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "✅ Frontend stopped (PID: $FRONTEND_PID)"
    rm /tmp/mulina_frontend.pid
fi

# Kill any remaining processes
pkill -f "uvicorn main:app" && echo "✅ Killed remaining uvicorn processes"
pkill -f "expo start" && echo "✅ Killed remaining expo processes"

echo ""
echo "✅ Mulina stopped successfully!"
