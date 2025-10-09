#!/bin/bash

# Production deployment script

echo "🚀 Starting Data Lookup Application deployment..."

# Create necessary directories
mkdir -p logs
mkdir -p uploads/chunks uploads/reports uploads/temp

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Copying environment configuration..."
    cp .env.docker .env
    echo "⚠️  Please update .env file with your production values!"
fi

# Build and start services
echo "🏗️  Building Docker images..."
docker compose build --no-cache

echo "🔄 Starting services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Run database migrations
echo "🗄️  Running database migrations..."
docker compose exec backend npx prisma migrate deploy

# Run database seeding (optional)
read -p "Do you want to seed the database? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    docker compose exec backend npm run db:seed
fi

# Check service health
echo "🔍 Checking service health..."
docker compose ps

echo "✅ Deployment complete!"
echo "🌐 Admin Panel: http://localhost"
echo "🔌 Backend API: http://localhost/api"
echo "🗄️  Database: localhost:5432"
echo "📊 Redis: localhost:6379"

echo ""
echo "📋 Useful commands:"
echo "  View logs: docker compose logs -f"
echo "  Stop services: docker compose down"
echo "  Restart services: docker compose restart"
echo "  Access backend shell: docker compose exec backend sh"