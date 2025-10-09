#!/bin/bash

# 🚀 Clean Deployment Script for Data Lookup Application
# Usage: ./deploy-clean.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo -e "${BLUE}🚀 Starting Data Lookup Application deployment...${NC}"

# Check if Docker and Docker Compose are installed
print_info "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are installed"

# Stop existing containers if running
print_info "Stopping existing containers..."
docker compose down --remove-orphans 2>/dev/null || true
print_status "Existing containers stopped"

# Clean up old images and volumes
print_info "Cleaning up old resources..."
docker system prune -f >/dev/null 2>&1 || true
print_status "System cleaned up"

# Create necessary directories
print_info "Creating directories..."
mkdir -p logs
mkdir -p backend/uploads/{chunks,reports,temp}
mkdir -p nginx/ssl
print_status "Directories created"

# Setup environment configuration
print_info "Setting up environment configuration..."

# Always ensure we have a fresh .env file for Docker deployment
if [ -f backend/.env.docker ]; then
    # Use .env.docker as the primary template for Docker deployment
    cp backend/.env.docker backend/.env
    print_status "Environment file created from .env.docker template"
elif [ -f backend/.env.example ]; then
    # Fallback to .env.example if .env.docker doesn't exist
    cp backend/.env.example backend/.env
    print_warning "Environment file created from .env.example"
    
    # Update for Docker environment
    sed -i.bak 's|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestdb|DATABASE_URL=postgresql://postgres:postgres@db:5432/fbdatabase|g' backend/.env
    sed -i.bak 's|REDIS_URL=redis://localhost:6379|REDIS_URL=redis://redis:6379|g' backend/.env
    sed -i.bak 's|NODE_ENV=development|NODE_ENV=production|g' backend/.env
    print_status "Environment configuration updated for Docker"
else
    print_error "No environment template found. Please create backend/.env.docker or backend/.env.example file."
    exit 1
fi

# Verify .env file exists and is readable
if [ ! -f backend/.env ] || [ ! -r backend/.env ]; then
    print_error "Failed to create backend/.env file"
    exit 1
fi

print_status "Environment configuration ready for Docker deployment"

# Build and start all services
print_info "Building and starting all services..."
docker compose build --no-cache --parallel
print_status "Docker images built successfully"

print_info "Starting all services..."
docker compose up -d
print_status "All services started"

# Wait for services to be ready with better feedback
print_info "Waiting for services to initialize..."
echo "This may take a few minutes..."

# Wait for database to be ready
print_info "Waiting for database..."
timeout=60
counter=0
until docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        print_error "Database failed to start within $timeout seconds"
        exit 1
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done
echo ""
print_status "Database is ready"

# Wait for Redis
print_info "Waiting for Redis..."
timeout=30
counter=0
until docker compose exec -T redis redis-cli ping >/dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        print_error "Redis failed to start within $timeout seconds"
        exit 1
    fi
    echo -n "."
    sleep 1
    counter=$((counter + 1))
done
echo ""
print_status "Redis is ready"

# Wait for backend to be healthy
print_info "Waiting for backend API..."
timeout=120
counter=0
until docker compose exec -T backend node healthcheck.js >/dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        print_warning "Backend health check timeout, but continuing..."
        break
    fi
    echo -n "."
    sleep 3
    counter=$((counter + 3))
done
echo ""
print_status "Backend API is ready"

# Run database migrations
print_info "Running database migrations..."
docker compose exec -T backend npx prisma migrate deploy
print_status "Database migrations completed"

# Generate Prisma client
print_info "Generating Prisma client..."
docker compose exec -T backend npx prisma generate
print_status "Prisma client generated"

# Optional database seeding
echo -e "${YELLOW}🌱 Do you want to seed the database with initial data? (y/N):${NC}"
read -t 10 -n 1 -r seed_choice || seed_choice='n'
echo ""
if [[ $seed_choice =~ ^[Yy]$ ]]; then
    print_info "Seeding database..."
    docker compose exec -T backend npm run db:seed 2>/dev/null || {
        docker compose exec -T backend npx prisma db seed 2>/dev/null || {
            print_warning "Seeding failed, but deployment continues"
        }
    }
    print_status "Database seeded"
else
    print_status "Database seeding skipped"
fi

# Final health checks
print_info "Performing final health checks..."
sleep 5

# Check service status
print_info "Service Status:"
docker compose ps

# Test API endpoints
print_info "Testing endpoints..."
sleep 5

# Test backend API
if timeout 10 curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then
    print_status "Backend API (http://localhost:8080/api) is responding"
else
    print_warning "Backend API health check failed - please check manually"
fi

# Test admin panel
if timeout 10 curl -sf http://localhost:8080 >/dev/null 2>&1; then
    print_status "Admin Panel (http://localhost:8080) is responding"
else
    print_warning "Admin Panel health check failed - please check manually"
fi

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE! 🎉${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo "   Admin Panel:     http://localhost:8080"
echo "   Backend API:     http://localhost:8080/api"
echo "   Database:        localhost:5432 (postgres/postgres)"
echo "   Redis:           localhost:6379"
echo ""
echo -e "${BLUE}📋 Useful Management Commands:${NC}"
echo "   View all logs:       docker compose logs -f"
echo "   View backend logs:   docker compose logs -f backend"
echo "   View admin logs:     docker compose logs -f frontend"
echo "   Stop all services:   docker compose down"
echo "   Restart all:         docker compose restart"
echo "   Access backend:      docker compose exec backend sh"
echo "   Database shell:      docker compose exec db psql -U postgres fbdatabase"
echo "   Redis CLI:           docker compose exec redis redis-cli"
echo ""
echo -e "${YELLOW}🔒 Security Notes:${NC}"
echo "   - Remember to update JWT secrets in backend/.env for production"
echo "   - Change default database passwords for production use"
echo "   - Configure SSL certificates for production deployment"
echo ""
echo -e "${GREEN}✨ Your application is now running! ✨${NC}"