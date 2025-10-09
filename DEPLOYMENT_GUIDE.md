# 🚀 Data Lookup Application - One-Command Deployment

## Quick Start

Deploy toàn bộ ứng dụng chỉ với 1 lệnh:

```bash
./deploy.sh
```

## Deployment Scripts

### 🚀 `./deploy.sh`
- **Mục đích**: Deploy toàn bộ ứng dụng với 1 lệnh
- **Chức năng**:
  - Kiểm tra prerequisites (Docker, Docker Compose)
  - Stop và clean up các container cũ
  - Build và start tất cả services
  - Chạy database migrations
  - Seed database (tùy chọn)
  - Health checks tự động
  - Hiển thị URLs và management commands

### 🛑 `./stop.sh`
- **Mục đích**: Dừng tất cả services một cách an toàn
- **Chức năng**:
  - Stop tất cả Docker containers
  - Clean up resources
  - Hiển thị cleanup commands

### 📊 `./status.sh`
- **Mục đích**: Kiểm tra trạng thái của tất cả services
- **Chức năng**:
  - Hiển thị container status
  - Health checks cho admin panel/backend
  - Hiển thị URLs và management commands

## Services & URLs

Sau khi deploy thành công, ứng dụng sẽ có sẵn tại:

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8080/api
- **Database**: localhost:5432 (postgres/postgres)
- **Redis**: localhost:6379

## Requirements

- Docker
- Docker Compose
- macOS/Linux với bash shell

## Useful Commands

### Deployment Management
```bash
# Deploy everything
./deploy.sh

# Check status
./status.sh

# Stop all services
./stop.sh
```

### Docker Management
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart specific service
docker-compose restart backend

# Access backend container
docker-compose exec backend sh

# Database shell
docker-compose exec db psql -U postgres nestdb

# Redis CLI
docker-compose exec redis redis-cli
```

### Development Commands
```bash
# Rebuild and restart
docker-compose down && docker-compose up --build -d

# Clean everything and start fresh
docker system prune -a -f && ./deploy.sh
```

## Configuration

### Environment Variables
- Các biến môi trường được cấu hình trong `backend/.env`
- Script tự động update DATABASE_URL cho Docker environment
- Tự động chuyển NODE_ENV sang production

### Database
- PostgreSQL 15 với user: `postgres`, password: `postgres`
- Database name: `nestdb`
- Auto-migration khi deploy
- Optional seeding

### Redis
- Redis 7 cho caching và queues
- Default configuration

### Nginx
- Reverse proxy chạy trên port 8080
- Route frontend và backend API

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using ports
   lsof -i :8080
   lsof -i :5432
   lsof -i :6379
   ```

2. **Docker issues**
   ```bash
   # Restart Docker service
   # On macOS: Restart Docker Desktop
   
   # Clean everything
   docker system prune -a -f
   ```

3. **Database connection issues**
   ```bash
   # Check database logs
   docker-compose logs db
   
   # Test database connection
   docker-compose exec db pg_isready -U postgres
   ```

4. **Backend not starting**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Rebuild backend
   docker-compose build backend --no-cache
   ```

### Logs Location
- Application logs: `./logs/`
- Upload files: `./backend/uploads/`

## Security Notes

⚠️ **Production Deployment**:
- Update JWT secrets trong `backend/.env`
- Thay đổi database passwords
- Cấu hình SSL certificates
- Review nginx security settings
- Set up proper firewall rules

## Development vs Production

Script này được tối ưu cho development và testing. Đối với production:
- Sử dụng external database
- Cấu hình proper secrets management
- Set up monitoring và logging
- Configure proper backup strategy
- Use proper domain và SSL