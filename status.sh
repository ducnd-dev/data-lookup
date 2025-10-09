#!/bin/bash

# 📊 STATUS SCRIPT - Check status of all services
# Usage: ./status.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Data Lookup Application Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

# Show container status
echo -e "${BLUE}🐳 Container Status:${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}🌐 Service URLs:${NC}"
echo "   Admin Panel:     http://localhost:8080"
echo "   Backend API:  http://localhost:8080/api"
echo "   Database:     localhost:5432"
echo "   Redis:        localhost:6379"

echo ""
echo -e "${BLUE}🔍 Quick Health Checks:${NC}"

# Test admin panel
if timeout 5 curl -sf http://localhost:8080 >/dev/null 2>&1; then
    echo "✅ Admin Panel is responding"
else
    echo "❌ Admin Panel is not responding"
fi

# Test backend API
if timeout 5 curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then
    echo "✅ Backend API is responding"
else
    echo "❌ Backend API is not responding"
fi

echo ""
echo -e "${BLUE}📋 Management Commands:${NC}"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    ./stop.sh"
echo "   Deploy:           ./deploy.sh"