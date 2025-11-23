#!/bin/bash
# Start the Anomalib FastAPI server

echo "Starting Anomalib FastAPI Server..."
echo "Server will be available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"
echo ""

uv run uvicorn server:app --host 0.0.0.0 --port 8000 --reload
