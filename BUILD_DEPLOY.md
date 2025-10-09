# 🔧 Data Lookup System - Build & Deploy Guide

This guide covers building and deploying the complete Data Lookup System with Docker.

## 📋 Prerequisites

- Docker & Docker Compose installed
- At least 2GB RAM available
- Ports 80, 3000, 5432, 6379 available

## 🚀 Quick Start

### 1. Build All Images
```bash
./build.sh
```

### 2. Deploy All Services
```bash
./deploy.sh start
```

### 3. Access Applications
- **Frontend (Users)**: http://fbdatabase.com
- **Admin Panel**: http://admin.fbdatabase.com  
- **Backend API**: http://api.fbdatabase.com

## 📖 Detailed Commands

### Build Script (`./build.sh`)
Builds all Docker images for the system:
- ✅ Validates Docker installation
- 🏗️  Builds backend, frontend, admin, nginx images
- 📋 Shows next steps

### Deploy Script (`./deploy.sh`)
Manages the entire application lifecycle:

```bash
# Start all services
./deploy.sh start

# Stop all services  
./deploy.sh stop

# Restart all services
./deploy.sh restart

# Show service status
./deploy.sh status

# View logs (all services)
./deploy.sh logs

# View logs (specific service)
./deploy.sh logs backend
./deploy.sh logs frontend
./deploy.sh logs admin

# Update and restart
./deploy.sh update

# Backup database
./deploy.sh backup

# Clean everything (⚠️ destructive)
./deploy.sh clean

# Show help
./deploy.sh help
```

## 🏗️ Architecture

```
Internet (Port 80) → Nginx Proxy
├── fbdatabase.com → Frontend (Next.js)
├── admin.fbdatabase.com → Admin Panel (Vue.js)
└── api.fbdatabase.com → Backend API (NestJS)
                         ↓
                    PostgreSQL + Redis
```

## 🐳 Docker Services

| Service | Description | Port | Health Check |
|---------|-------------|------|--------------|
| `frontend` | Next.js user app | 3000 | HTTP ping |
| `admin` | Vue.js admin panel | 80 | Static files |
| `backend` | NestJS API server | 3000 | Custom health |
| `db` | PostgreSQL database | 5432 | pg_isready |
| `redis` | Redis cache | 6379 | Redis ping |
| `nginx` | Reverse proxy | 80 | - |

## 📁 Project Structure

```
data-lookup/
├── build.sh              # Build all images
├── deploy.sh             # Deployment management
├── docker-compose.yml    # Service orchestration
├── frontend/             # Next.js user app
│   ├── Dockerfile
│   └── src/
├── admin/                # Vue.js admin panel  
│   ├── Dockerfile
│   └── src/
├── backend/              # NestJS API
│   ├── Dockerfile
│   └── src/
└── nginx/                # Reverse proxy config
    └── conf.d/
```

## 🔧 Development Workflow

### Initial Setup
```bash
# Clone repository
git clone <repository>
cd data-lookup

# Build images
./build.sh

# Start services
./deploy.sh start
```

### Daily Development
```bash
# Check status
./deploy.sh status

# View logs
./deploy.sh logs backend

# Restart after changes
./deploy.sh restart

# Backup before major changes
./deploy.sh backup
```

### Troubleshooting
```bash
# Check service health
./deploy.sh status

# View detailed logs
./deploy.sh logs

# Clean restart
./deploy.sh stop
./deploy.sh clean
./build.sh
./deploy.sh start
```

## 📊 Monitoring & Maintenance

### Health Checks
- Database: `docker-compose exec db pg_isready -U postgres`
- Redis: `docker-compose exec redis redis-cli ping`  
- Backend: `curl http://api.fbdatabase.com/health`

### Backup & Recovery
```bash
# Create backup
./deploy.sh backup

# Restore from backup (manual)
docker-compose exec -T db psql -U postgres nestdb < backups/backup_YYYYMMDD_HHMMSS.sql
```

### Log Management
```bash
# View real-time logs
./deploy.sh logs

# Service-specific logs
./deploy.sh logs backend
./deploy.sh logs frontend

# Export logs
docker-compose logs > system.log
```

## 🔒 Security Notes

### Production Checklist
- [ ] Update JWT secrets in `backend/.env`
- [ ] Change default database passwords
- [ ] Configure SSL certificates
- [ ] Set up firewall rules
- [ ] Enable monitoring & alerting
- [ ] Configure backup automation

### Environment Variables
Key variables to customize in production:
```env
# Backend
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secret-key
REDIS_URL=redis://host:port

# Frontend  
BACKEND_URL=https://api.yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret
```

## 🆘 Emergency Procedures

### Quick Recovery
```bash
# Stop everything
./deploy.sh stop

# Clean system
./deploy.sh clean

# Rebuild and restart
./build.sh
./deploy.sh start
```

### Database Issues
```bash
# Check database
docker-compose exec db pg_isready -U postgres

# Database shell
docker-compose exec db psql -U postgres nestdb

# Reset database (⚠️ destructive)
docker-compose down -v
./deploy.sh start
```

## 📞 Support

- **Logs**: `./deploy.sh logs`
- **Status**: `./deploy.sh status`  
- **Health**: Check service URLs above
- **Backup**: `./deploy.sh backup`