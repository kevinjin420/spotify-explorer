#!/bin/bash

# Exit on error
set -e

# Activate virtualenv
source venv/bin/activate

# Start Django backend in the background
echo "Starting Django backend..."
python manage.py runserver &
DJANGO_PID=$!

# Trap SIGINT (Ctrl+C) and SIGTERM to clean up background processes
cleanup() {
  echo "Shutting down..."
  kill $DJANGO_PID
  wait $DJANGO_PID 2>/dev/null
  exit
}
trap cleanup SIGINT SIGTERM

# Start Vite frontend (blocks)
echo "Starting Vite frontend..."
cd frontend
npm run dev

# Wait for background Django to finish (if Vite exits early)
wait $DJANGO_PID
