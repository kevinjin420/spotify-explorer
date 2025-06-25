#!/bin/bash

# Exit on error
set -e

# Activate Python virtualenv
source venv/bin/activate

# Start Django backend
echo "Starting Django backend..."
python manage.py runserver &

# Start frontend (Vite)
echo "Starting Vite frontend..."
cd frontend
npm run dev
