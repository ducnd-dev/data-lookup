#!/bin/bash

# Build script for the Data Lookup System
# This script builds all Docker images for the project

set -e  # Exit on any error

echo "🏗️  Building Data Lookup System Docker Images..."
echo "=================================================="

# Function to print colored output
print_status() {
    echo -e "\033[1;34m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m$1\033[0m"
}

print_error() {
    echo -e "\033[1;31m$1\033[0m"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build all services
print_status "� Building Docker images..."

print_status "🔧 Building Backend (NestJS)..."
docker-compose build backend

print_status "🌐 Building Frontend (Next.js)..."
docker-compose build frontend

print_status "⚙️  Building Admin (Vue.js)..."
docker-compose build admin

print_status "🔄 Building Nginx Proxy..."
docker-compose build nginx

print_success "✅ All Docker images built successfully!"
echo ""
echo "� Next steps:"
echo "  🚀 Deploy: ./deploy.sh"
echo "  🔍 Check: docker images | grep data-lookup"
echo "  🧹 Clean: docker system prune"