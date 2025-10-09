#!/bin/bash

# 🚀 ONE-COMMAND DEPLOYMENT SCRIPT
# Duc's Data Lookup Application - Complete Deployment
# Usage: ./deploy.sh

set -e  # Exit on any error

# Configuration
PROJECT_NAME="data-lookup"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Data Lookup Application deployment...${NC}"

# Function to print colored messages
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}echo -e "${BLUE}🚀 Starting Data Lookup Application deployment...${NC}"



print_success() {# Function to print colored messages

    echo -e "\033[1;32m$1\033[0m"print_status() {

}    echo -e "${GREEN}✅ $1${NC}"

}

print_error() {

    echo -e "\033[1;31m$1\033[0m"print_warning() {

}    echo -e "${YELLOW}⚠️  $1${NC}"

}

print_warning() {

    echo -e "\033[1;33m$1\033[0m"print_error() {

}    echo -e "${RED}❌ $1${NC}"

}

# Function to show usage

show_usage() {# Check if Docker and Docker Compose are installed

    echo "Usage: $0 [COMMAND]"echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

    echo ""if ! command -v docker &> /dev/null; then

    echo "Commands:"    print_error "Docker is not installed. Please install Docker first."

    echo "  start     Start all services"    exit 1

    echo "  stop      Stop all services"fi

    echo "  restart   Restart all services"

    echo "  status    Show service status"if ! command -v docker compose &> /dev/null; then

    echo "  logs      Show logs (use with service name: logs backend)"    print_error "Docker Compose is not installed. Please install Docker Compose first."

    echo "  update    Pull latest images and restart"    exit 1

    echo "  clean     Stop and remove all containers, networks, volumes"fi

    echo "  backup    Backup database"print_status "Docker and Docker Compose are installed"

    echo "  help      Show this help message"

    echo ""# Stop existing containers if running

    echo "Examples:"echo -e "${BLUE}🛑 Stopping existing containers...${NC}"

    echo "  $0 start"docker compose down --remove-orphans 2>/dev/null || true

    echo "  $0 logs backend"print_status "Existing containers stopped"

    echo "  $0 status"

}# Clean up old images and volumes

echo -e "${BLUE}🧹 Cleaning up old resources...${NC}"

# Function to wait for services to be healthydocker system prune -f >/dev/null 2>&1 || true

wait_for_services() {print_status "System cleaned up"

    print_status "⏳ Waiting for services to be ready..."

    # Create necessary directories

    local max_attempts=30echo -e "${BLUE}📁 Creating directories...${NC}"

    local attempt=1mkdir -p logs

    mkdir -p backend/uploads/{chunks,reports,temp}

    while [ $attempt -le $max_attempts ]; domkdir -p nginx/ssl

        if docker-compose ps | grep -q "Up.*healthy"; thenprint_status "Directories created"

            print_success "✅ Services are healthy!"

            return 0# Setup environment configuration

        fiecho -e "${BLUE}📝 Setting up environment configuration...${NC}"

        

        echo "Attempt $attempt/$max_attempts - Waiting for services..."# Always ensure we have a fresh .env file for Docker deployment

        sleep 10if [ -f backend/.env.docker ]; then

        ((attempt++))    # Use .env.docker as the primary template for Docker deployment

    done    cp backend/.env.docker backend/.env

        print_status "Environment file created from .env.docker template"

    print_warning "⚠️  Services may not be fully ready. Check with 'docker-compose ps'"elif [ -f backend/.env.example ]; then

}    # Fallback to .env.example if .env.docker doesn't exist

    cp backend/.env.example backend/.env

# Function to show service status    print_warning "Environment file created from .env.example"

show_status() {    

    print_status "📊 Service Status:"    # Update for Docker environment

    echo "=================="    sed -i.bak 's|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestdb|DATABASE_URL=postgresql://postgres:postgres@db:5432/nestdb|g' backend/.env

    docker-compose ps    sed -i.bak 's|REDIS_URL=redis://localhost:6379|REDIS_URL=redis://redis:6379|g' backend/.env

    echo ""    sed -i.bak 's|NODE_ENV=development|NODE_ENV=production|g' backend/.env

        print_status "Environment configuration updated for Docker"

    print_status "🔍 Resource Usage:"else

    echo "=================="    print_error "No environment template found. Please create backend/.env.docker or backend/.env.example file."

    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"    exit 1

}fi



# Function to show logs# Verify .env file exists and is readable

show_logs() {if [ ! -f backend/.env ] || [ ! -r backend/.env ]; then

    local service=$1    print_error "Failed to create backend/.env file"

    if [ -z "$service" ]; then    exit 1

        print_status "📝 Showing logs for all services (last 50 lines):"fi

        docker-compose logs --tail=50 -f

    elseprint_status "Environment configuration ready for Docker deployment"

        print_status "📝 Showing logs for $service:"

        docker-compose logs --tail=100 -f "$service"# Build and start all services

    fiecho -e "${BLUE}🏗️  Building and starting all services...${NC}"

}docker compose build --no-cache --parallel

print_status "Docker images built successfully"

# Function to backup database

backup_database() {echo -e "${BLUE}🔄 Starting all services...${NC}"

    print_status "💾 Creating database backup..."docker compose up -d

    print_status "All services started"

    # Create backups directory if it doesn't exist

    mkdir -p backups# Wait for services to be ready with better feedback

    echo -e "${BLUE}⏳ Waiting for services to initialize...${NC}"

    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"echo "This may take a few minutes..."

    

    docker-compose exec -T db pg_dump -U postgres nestdb > "backups/$backup_file"# Wait for database to be ready

    echo -e "${BLUE}�️  Waiting for database...${NC}"

    if [ $? -eq 0 ]; thentimeout=60

        print_success "✅ Database backup created: backups/$backup_file"counter=0

    elseuntil docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; do

        print_error "❌ Database backup failed!"    if [ $counter -ge $timeout ]; then

        exit 1        print_error "Database failed to start within $timeout seconds"

    fi        exit 1

}    fi

    echo -n "."

# Function to start services    sleep 2

start_services() {    counter=$((counter + 2))

    print_status "🚀 Starting Data Lookup System..."done

    echo "=================================="echo ""

    print_status "Database is ready"

    # Check if images exist

    if ! docker images | grep -q "${PROJECT_NAME}"; then# Wait for Redis

        print_warning "⚠️  Docker images not found. Building first..."echo -e "${BLUE}📊 Waiting for Redis...${NC}"

        ./build.shtimeout=30

    ficounter=0

    until docker compose exec -T redis redis-cli ping >/dev/null 2>&1; do

    # Create necessary directories    if [ $counter -ge $timeout ]; then

    mkdir -p logs backups        print_error "Redis failed to start within $timeout seconds"

    mkdir -p backend/uploads/{chunks,reports,temp}        exit 1

        fi

    # Setup environment if needed    echo -n "."

    if [ ! -f backend/.env ]; then    sleep 1

        print_warning "⚠️  Backend .env file not found. Creating from template..."    counter=$((counter + 1))

        if [ -f backend/.env.example ]; thendone

            cp backend/.env.example backend/.envecho ""

            print_status "Environment file created from template"print_status "Redis is ready"

        else

            print_error "❌ No environment template found!"# Wait for backend to be healthy

            exit 1echo -e "${BLUE}🔌 Waiting for backend API...${NC}"

        fitimeout=120

    ficounter=0

    until docker compose exec -T backend node healthcheck.js >/dev/null 2>&1; do

    # Start services    if [ $counter -ge $timeout ]; then

    print_status "🔄 Starting services..."        print_warning "Backend health check timeout, but continuing..."

    docker-compose up -d        break

        fi

    # Wait for database    echo -n "."

    print_status "🗄️  Waiting for database..."    sleep 3

    timeout=60    counter=$((counter + 3))

    counter=0done

    until docker-compose exec -T db pg_isready -U postgres >/dev/null 2>&1; doecho ""

        if [ $counter -ge $timeout ]; thenprint_status "Backend API is ready"

            print_error "Database failed to start within $timeout seconds"

            exit 1# Run database migrations

        fiecho -e "${BLUE}🗄️  Running database migrations...${NC}"

        echo -n "."docker compose exec -T backend npx prisma migrate deploy

        sleep 2print_status "Database migrations completed"

        counter=$((counter + 2))

    done# Generate Prisma client

    echo ""echo -e "${BLUE}🔧 Generating Prisma client...${NC}"

    print_success "Database is ready"docker compose exec -T backend npx prisma generate

    print_status "Prisma client generated"

    # Run migrations

    print_status "🔧 Running database migrations..."# Optional database seeding

    docker-compose exec -T backend npx prisma migrate deployecho -e "${YELLOW}🌱 Do you want to seed the database with initial data? (y/N):${NC}"

    read -t 10 -n 1 -r seed_choice || seed_choice='n'

    # Generate Prisma clientecho ""

    print_status "⚙️  Generating Prisma client..."if [[ $seed_choice =~ ^[Yy]$ ]]; then

    docker-compose exec -T backend npx prisma generate    echo -e "${BLUE}🌱 Seeding database...${NC}"

        docker compose exec -T backend npm run db:seed 2>/dev/null || {

    # Wait for services        docker compose exec -T backend npx prisma db seed 2>/dev/null || {

    wait_for_services            print_warning "Seeding failed, but deployment continues"

            }

    # Show final status    }

    show_status    print_status "Database seeded"

    else

    print_success "🎉 Deployment completed successfully!"    print_status "Database seeding skipped"

    echo ""fi

    echo "📋 Service URLs:"

    echo "🌐 Frontend (Users): https://fbdatabase.com"# Final health checks

    echo "⚙️  Admin Panel: https://admin.fbdatabase.com"echo -e "${BLUE}🔍 Performing final health checks...${NC}"

    echo "🔧 Backend API: https://api.fbdatabase.com"sleep 5

    echo ""

    echo "📊 Monitoring Commands:"# Check service status

    echo "  Status: $0 status"echo -e "${BLUE}📊 Service Status:${NC}"

    echo "  Logs: $0 logs [service_name]"docker compose ps

    echo "  Stop: $0 stop"

}# Test API endpoints

echo -e "${BLUE}🧪 Testing endpoints...${NC}"

# Function to stop servicessleep 5

stop_services() {

    print_status "⏹️  Stopping Data Lookup System..."# Test backend API

    docker-compose downif timeout 10 curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then

    print_success "✅ All services stopped!"    print_status "Backend API (http://localhost:8080/api) is responding"

}else

    print_warning "Backend API health check failed - please check manually"

# Function to restart servicesfi

restart_services() {

    print_status "🔄 Restarting Data Lookup System..."# Test admin panel

    docker-compose restartif timeout 10 curl -sf http://localhost:8080 >/dev/null 2>&1; then

    wait_for_services    print_status "Admin Panel (http://localhost:8080) is responding"

    show_statuselse

    print_success "✅ All services restarted!"    print_warning "Admin Panel health check failed - please check manually"

}fi



# Function to update and restartecho ""

update_services() {echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE! 🎉${NC}"

    print_status "📥 Updating Data Lookup System..."echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    echo -e "${BLUE}🌐 Application URLs:${NC}"

    # Pull latest imagesecho "   Admin Panel:     http://localhost:8080"

    print_status "📦 Pulling latest images..."echo "   Backend API:  http://localhost:8080/api"

    docker-compose pullecho "   Database:     localhost:5432 (postgres/postgres)"

    echo "   Redis:        localhost:6379"

    # Rebuild if neededecho ""

    print_status "🔧 Rebuilding services..."echo -e "${BLUE}📋 Useful Management Commands:${NC}"

    docker-compose buildecho "   View all logs:       docker compose logs -f"

    echo "   View backend logs:   docker compose logs -f backend"

    # Restart servicesecho "   View admin logs:     docker compose logs -f frontend"

    print_status "🔄 Restarting with new images..."echo "   Stop all services:   docker compose down"

    docker-compose up -decho "   Restart all:         docker compose restart"

    echo "   Access backend:      docker compose exec backend sh"

    wait_for_servicesecho "   Database shell:      docker compose exec db psql -U postgres nestdb"

    show_statusecho "   Redis CLI:           docker compose exec redis redis-cli"

    print_success "✅ Update completed!"echo ""

}echo -e "${YELLOW}🔒 Security Notes:${NC}"

echo "   - Remember to update JWT secrets in backend/.env for production"

# Function to clean everythingecho "   - Change default database passwords for production use"

clean_all() {echo "   - Configure SSL certificates for production deployment"

    print_warning "⚠️  This will remove all containers, networks, and volumes!"echo ""

    read -p "Are you sure? (y/N): " -n 1 -recho -e "${GREEN}✨ Your application is now running! ✨${NC}"
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "🧹 Cleaning up..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "✅ Cleanup completed!"
    else
        echo "Cleanup cancelled."
    fi
}

# Main script logic
case "$1" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "update")
        update_services
        ;;
    "clean")
        clean_all
        ;;
    "backup")
        backup_database
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    "")
        print_error "❌ No command specified!"
        echo ""
        show_usage
        exit 1
        ;;
    *)
        print_error "❌ Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac