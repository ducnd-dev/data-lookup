#!/bin/bash

# Script to setup persistent data directories for Docker volumes
# This ensures data persistence across container restarts and removals

echo "🔧 Setting up persistent data directories..."

# Create data directories
mkdir -p ./data/postgres
mkdir -p ./data/redis
mkdir -p ./data/uploads
mkdir -p ./logs

# Set proper permissions
echo "📁 Setting permissions..."

# PostgreSQL data directory (needs postgres user permissions)
sudo chown -R 999:999 ./data/postgres || chown -R 999:999 ./data/postgres

# Redis data directory
sudo chown -R 999:999 ./data/redis || chown -R 999:999 ./data/redis

# Uploads directory (needs to be writable by backend user)
sudo chown -R 1001:65533 ./data/uploads || chown -R 1001:65533 ./data/uploads

# Logs directory
sudo chown -R 1001:65533 ./logs || chown -R 1001:65533 ./logs

echo "✅ Data directories created successfully!"
echo ""
echo "📂 Directory structure:"
echo "  ./data/postgres  - PostgreSQL database files"
echo "  ./data/redis     - Redis persistence files"  
echo "  ./data/uploads   - Application uploads"
echo "  ./logs          - Application logs"
echo ""
echo "🔒 Data will persist even if containers are removed!"
echo "💡 To backup: tar -czf backup.tar.gz ./data ./logs"
echo "💡 To restore: tar -xzf backup.tar.gz"