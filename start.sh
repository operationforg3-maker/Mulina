#!/bin/bash

# Mulina - Quick Start Script
# Uruchamia backend i frontend jednocześnie

echo "🚀 Starting Mulina Application..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get project root
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"
echo ""

# Start Backend
echo -e "${GREEN}🔧 Starting Backend (FastAPI)...${NC}"
cd "${PROJECT_ROOT}/backend"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Creating..."
    python3 -m venv venv
    echo "📦 Installing dependencies..."
    ./venv/bin/pip install -r requirements.txt
fi

# Start backend in background
./venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > /tmp/mulina_backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: ${BACKEND_PID})${NC}"
echo "   📝 Logs: /tmp/mulina_backend.log"
echo "   🌐 URL: http://localhost:8000"
echo ""

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Test backend
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy!${NC}"
else
    echo "⚠️  Backend might still be starting..."
fi
echo ""

# Start Frontend
echo -e "${GREEN}🎨 Starting Frontend (Expo Web)...${NC}"
cd "${PROJECT_ROOT}/mobile"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Start frontend in background
npx expo start --web > /tmp/mulina_frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: ${FRONTEND_PID})${NC}"
echo "   📝 Logs: /tmp/mulina_frontend.log"
echo "   🌐 URL: http://localhost:8081"
echo ""

# Wait for frontend
echo "⏳ Waiting for frontend to be ready..."
sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Mulina is running!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 Backend API:  http://localhost:8000"
echo "   📚 API Docs:  http://localhost:8000/docs"
echo "   💚 Health:    http://localhost:8000/health"
echo ""
echo "🎨 Frontend Web: http://localhost:8081"
echo ""
echo "📊 Process IDs:"
echo "   Backend:  ${BACKEND_PID}"
echo "   Frontend: ${FRONTEND_PID}"
echo ""
echo "📝 Logs:"
echo "   tail -f /tmp/mulina_backend.log"
echo "   tail -f /tmp/mulina_frontend.log"
echo ""
echo "🛑 To stop:"
echo "   kill ${BACKEND_PID} ${FRONTEND_PID}"
echo "   or run: ${PROJECT_ROOT}/stop.sh"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Save PIDs for stop script
echo "${BACKEND_PID}" > /tmp/mulina_backend.pid
echo "${FRONTEND_PID}" > /tmp/mulina_frontend.pid

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping Mulina...'; kill ${BACKEND_PID} ${FRONTEND_PID} 2>/dev/null; echo '✅ Stopped'; exit 0" INT

# Keep script running
wait
