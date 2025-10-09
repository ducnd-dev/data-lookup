@echo off
REM Windows deployment script

echo 🚀 Starting Data Lookup Application deployment...

REM Create necessary directories
if not exist logs mkdir logs
if not exist uploads mkdir uploads
if not exist uploads\chunks mkdir uploads\chunks
if not exist uploads\reports mkdir uploads\reports
if not exist uploads\temp mkdir uploads\temp

REM Copy environment file
if not exist .env (
    echo 📝 Copying environment configuration...
    copy .env.docker .env
    echo ⚠️  Please update .env file with your production values!
)

REM Build and start services
echo 🏗️  Building Docker images...
docker-compose build --no-cache

echo 🔄 Starting services...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak

REM Run database migrations
echo 🗄️  Running database migrations...
docker-compose exec backend npx prisma migrate deploy

REM Check service health
echo 🔍 Checking service health...
docker-compose ps

echo ✅ Deployment complete!
echo 🌐 Frontend: http://localhost
echo 🔌 Backend API: http://localhost/api
echo 🗄️  Database: localhost:5432
echo 📊 Redis: localhost:6379

echo.
echo 📋 Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop services: docker-compose down
echo   Restart services: docker-compose restart
echo   Access backend shell: docker-compose exec backend sh

pause