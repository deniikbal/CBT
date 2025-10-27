#!/bin/bash

# Stop all running processes
echo "Stopping all node processes..."
pkill -9 -f "node.*3000" 2>/dev/null || true
pkill -9 -f "tsx.*server" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Wait a bit
sleep 2

# Clear Next.js cache
echo "Clearing Next.js cache..."
cd /home/deniikbal/Documents/project/CBT
rm -rf .next

# Start dev server
echo "Starting development server..."
echo ""
echo "========================================"
echo "Admin Panel akan tersedia di:"
echo "http://localhost:3000/admin"
echo "========================================"
echo ""

npm run dev
