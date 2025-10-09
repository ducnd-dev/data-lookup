#!/bin/bash

# 🛑 STOP SCRIPT - Gracefully stop all services
# Usage: ./stop.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping Data Lookup Application...${NC}"

# Stop all services
echo -e "${BLUE}📦 Stopping Docker containers...${NC}"
docker-compose down --remove-orphans

echo -e "${GREEN}✅ All services stopped successfully!${NC}"
echo ""
echo -e "${YELLOW}🗂️  Optional cleanup commands:${NC}"
echo "   Remove unused images:    docker image prune -f"
echo "   Remove unused volumes:   docker volume prune -f"
echo "   Remove everything:       docker system prune -a -f"
echo ""
echo -e "${BLUE}🔄 To restart:${NC}"
echo "   Run deployment:          ./deploy.sh"