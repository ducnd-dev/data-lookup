# Data Lookup Application

A full-stack application for data lookup and management with Vue.js admin panel and NestJS backend.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker + Docker Compose (Linux)
- Git

### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd data-lookup

# Start application
docker-compose up -d
```

**Access the application:**
- 🌐 Admin Panel: http://localhost:5173
- 🔌 Backend API: http://localhost:3000
- 🗄️ Database: localhost:5432
- 📊 Redis: localhost:6379

### Production Deployment

```bash
# Navigate to project root
cd data-lookup

# Deploy production environment
chmod +x deploy.sh && ./deploy.sh
```

**Access the application:**
- 🌐 Application: http://localhost
- 🔌 API: http://localhost/api
- 🔧 Nginx Proxy: http://localhost:8080

## 📋 Common Commands

### Development
```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend

# Access backend shell
docker-compose exec backend sh
```

### Production
```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Access backend shell
docker-compose exec backend sh
```

### Database Operations
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Access database
docker-compose exec db psql -U postgres nestdb

# Backup database
docker-compose exec db pg_dump -U postgres nestdb > backup.sql
```

## 🏗️ Architecture

- **Admin Panel**: Vue.js 3 + TypeScript + Tailwind CSS + Naive UI
- **Backend**: NestJS + TypeScript + Prisma ORM
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **Reverse Proxy**: Nginx
- **Containerization**: Docker + Docker Compose

## 📁 Project Structure

```
data-lookup/
├── admin/          # Vue.js application
├── backend/           # NestJS API
├── nginx/            # Nginx configuration
├── scripts/          # Database scripts
├── docker-compose.yml         # Docker configuration
├── deploy.sh             # Deployment script
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/nestdb
JWT_ACCESS_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_key
REDIS_URL=redis://redis:6379
NODE_ENV=development
```

**Admin Panel (.env.development):**
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Data Lookup Application
```

## 🛠️ Development

### Adding New Features

1. **Backend Changes:**
   - Edit files in `./backend/src/`
   - Hot reload is enabled
   - Database changes: `npx prisma migrate dev`

2. **Admin Panel Changes:**
   - Edit files in `./admin/src/`
   - Hot reload is enabled
   - New packages: `docker-compose exec frontend npm install <package>`

### Debugging

- **Backend Debug Port**: localhost:9229
- **VS Code**: Attach to running container
- **Logs**: `docker-compose logs -f backend`

## 📚 Documentation

- [Docker Deployment Guide](./DOCKER_DEPLOYMENT.md) - Comprehensive deployment documentation
- [API Integration Guide](./admin/API_INTEGRATION.md) - Admin Panel API usage
- [Testing Guide](./admin/TESTING_GUIDE.md) - Testing the application

## 🔒 Security

- Change default passwords in production
- Update JWT secrets
- Configure SSL certificates
- Review nginx security settings
- Use environment-specific configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `docker-compose up`
5. Submit a pull request

## 📄 License

[Add your license information here]