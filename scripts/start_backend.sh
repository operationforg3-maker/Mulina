#!/bin/bash

# Start backend server
cd /Users/tomaszgorecki/Projekty/KITS/backend

echo "🚀 Starting SmartStitch Backend..."
echo "📍 Location: $(pwd)"
echo "🐍 Python: $(./venv/bin/python --version)"
echo ""

# Activate venv and run
./venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

