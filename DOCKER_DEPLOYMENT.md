# Docker Deployment Guide

This guide explains how to deploy the Data Lookup Application using Docker and Nginx from the root directory.

## 🏗️ Project Structure

```
data-lookup/
├── docker-compose.yml          # Docker configuration
├── deploy.sh              # Deployment script
├── .env                       # Root environment variables
├── .dockerignore              # Root docker ignore
├── nginx/                     # Nginx configuration
│   ├── nginx.conf
│   └── conf.d/default.conf
├── scripts/                   # Database and utility scripts
│   └── init-db.sql
├── backend/                   # Backend application
│   ├── Dockerfile             # Backend dockerfile
│   ├── .env                   # Backend environment
│   └── ...
├── admin/                     # Admin panel application
│   ├── Dockerfile             # Admin panel dockerfile
│   └── ...
└── logs/                      # Application logs
```

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Admin Panel   │    │    Backend      │
│  (Reverse Proxy)│────│   (Vue.js)      │────│   (NestJS)      │
│     Port 8080   │    │   Port 80       │    │   Port 3000     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │    PostgreSQL   │    │      Redis      │
                       │    Port 5432    │    │    Port 6379    │
                       └─────────────────┘    └─────────────────┘
```

## 📦 Services

### Admin Panel (Vue.js + Nginx)
- **Image**: Multi-stage build with Node.js and Nginx
- **Port**: 80
- **Features**: SPA routing, static asset caching, API proxy

### Backend (NestJS)
- **Image**: Node.js Alpine with production optimizations
- **Port**: 3000
- **Features**: Health checks, proper signal handling, security

### Database (PostgreSQL)
- **Image**: PostgreSQL 15 Alpine
- **Port**: 5432
- **Features**: Persistent storage, health checks

### Cache/Queue (Redis)
- **Image**: Redis 7 Alpine
- **Port**: 6379
- **Features**: Persistent storage, health checks

### Reverse Proxy (Nginx)
- **Image**: Nginx Alpine
- **Port**: 8080 (HTTP), 8443 (HTTPS)
- **Features**: Load balancing, SSL termination, rate limiting

## 🚀 Quick Start

### Production Deployment

1. **Navigate to project root:**
   ```bash
   cd data-lookup
   ```

2. **Run deployment script:**
   ```bash
   # Linux/macOS
   chmod +x deploy.sh
   ./deploy.sh

   # Windows
   deploy.bat
   ```

3. **Manual deployment:**
   ```bash
   # Build and start all services
   docker-compose up -d

   # Run database migrations
   docker-compose exec backend npx prisma migrate deploy

   # Optional: Seed database
   docker-compose exec backend npm run db:seed
   ```

### Development Mode

```bash
# Start application
docker-compose up -d
```

## 📋 Environment Configuration

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/nestdb

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_ACCESS_SECRET=your_super_secret_jwt_access_key
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key

# Redis
REDIS_URL=redis://redis:6379

# Application
NODE_ENV=production
PORT=3000
UPLOAD_PATH=./uploads
```

### Admin Panel (.env.production)
```env
VITE_API_URL=/api
VITE_APP_NAME=Data Lookup Application
VITE_APP_VERSION=1.0.0
```

## 🔧 Service Management

### Basic Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f
docker-compose logs -f backend

# Check service status
docker-compose ps

# Access service shell
docker-compose exec backend sh
docker-compose exec admin sh
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npm run db:seed

# Access database
docker-compose exec db psql -U postgres -d nestdb

# Backup database
docker-compose exec db pg_dump -U postgres nestdb > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres nestdb < backup.sql
```

### Monitoring

```bash
# View resource usage
docker stats

# Check health status
docker-compose exec backend node healthcheck.js

# View service logs
docker-compose logs --tail=100 -f backend
```

## 🔐 Security Features

### Nginx Security
- Rate limiting on API endpoints
- Security headers (HSTS, XSS Protection, etc.)
- Request size limits
- SSL/TLS configuration ready

### Application Security
- Non-root user in containers
- Health checks for all services
- Proper signal handling
- Environment variable isolation

### Database Security
- Isolated network
- Health monitoring
- Persistent storage with proper permissions

## 🌐 Network Configuration

### Internal Communication
- All services communicate via Docker network `app-network`
- Services use container names for internal DNS resolution
- No external ports exposed except for ingress points

### External Access
- **Admin Panel**: http://localhost (port 80)
- **API**: http://localhost/api (proxied through admin panel)
- **Admin Access**: 
  - Database: localhost:5432
  - Redis: localhost:6379
  - Backend Direct: localhost:3000

### Production Reverse Proxy
- **HTTP**: localhost:8080
- **HTTPS**: localhost:8443 (requires SSL certificates)

## 📊 Monitoring & Logging

### Health Checks
All services include health checks:
- **Backend**: HTTP health endpoint
- **Database**: PostgreSQL ping
- **Redis**: Redis ping
- **Admin Panel**: Nginx status

### Log Aggregation
```bash
# View all logs
docker-compose logs -f

# Filter by service
docker-compose logs -f backend

# Follow specific number of lines
docker-compose logs --tail=50 -f
```

### Performance Monitoring
```bash
# Resource usage
docker stats

# Service status
docker-compose ps

# Network information
docker network inspect data-lookup_app-network
```

## 🔄 Updates & Maintenance

### Updating Services

```bash
# Update application code
git pull origin main

# Rebuild specific service
docker-compose build --no-cache backend
docker-compose up -d backend

# Rebuild all services
docker-compose build --no-cache
docker-compose up -d
```

### Database Maintenance

```bash
# Create migration
docker-compose exec backend npx prisma migrate dev --name migration_name

# Apply migrations
docker-compose exec backend npx prisma migrate deploy

# Reset database (CAUTION: destroys data)
docker-compose exec backend npx prisma migrate reset --force
```

### Backup & Recovery

```bash
# Database backup
docker-compose exec db pg_dump -U postgres nestdb > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Volume backup
docker run --rm -v data-lookup_pgdata:/data -v $(pwd):/backup alpine tar czf /backup/pgdata_backup.tar.gz /data

# Restore from backup
docker-compose down
docker volume rm data-lookup_pgdata
docker-compose up -d db
# Wait for db to initialize, then:
docker-compose exec -T db psql -U postgres nestdb < backup.sql
```

## 🐛 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker-compose logs backend

# Check resource usage
docker system df
docker system prune # Clean up if needed
```

**Database connection issues:**
```bash
# Check database is running
docker-compose ps db

# Test connection
docker-compose exec backend npx prisma db push
```

**Admin panel not loading:**
```bash
# Check nginx configuration
docker-compose exec frontend nginx -t

# Rebuild admin panel
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

**Permission issues:**
```bash
# Fix upload directory permissions
sudo chown -R 1001:1001 uploads/
```

### Performance Issues

**High memory usage:**
```bash
# Check container stats
docker stats

# Limit container resources (in docker-compose.yml)
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

**Slow database queries:**
```bash
# Access database and check slow queries
docker-compose exec db psql -U postgres nestdb
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

## 🔗 Production Deployment

### SSL Configuration

1. **Obtain SSL certificates** (Let's Encrypt recommended)
2. **Place certificates** in `nginx/ssl/` directory
3. **Update nginx configuration** to enable HTTPS
4. **Use production profile:**
   ```bash
   docker-compose --profile production up -d
   ```

### Environment Variables

Ensure these are set for production:
- Change all default passwords
- Use strong JWT secrets
- Configure proper CORS origins
- Set up monitoring and logging
- Configure backup schedules

### Scaling

For high-traffic deployments:
```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Use external load balancer
# Configure Redis cluster
# Use managed database service
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)