# 🧪 TESTING SUITE FOR NESTJS BACKEND

Bộ test scripts comprehensive để kiểm tra toàn bộ hệ thống NestJS Backend với Pagination, Authentication, File Upload, Export, và các tính năng khác.

## 📋 Danh sách Test Scripts

### 1. 🎯 `test-quick.sh` - Quick System Test
**Mục đích**: Test nhanh các chức năng chính của hệ thống  
**Thời gian**: ~30 giây  
**Sử dụng**:
```bash
./test-quick.sh
```

**Kiểm tra**:
- ✅ Authentication (Login)
- ✅ Pagination APIs (Users, Roles, Jobs)
- ✅ Lookup Query với pagination
- ✅ Export APIs
- ✅ File management
- ✅ System reports

---

### 2. 🚀 `test-full-system.sh` - Comprehensive System Test
**Mục đích**: Test toàn diện với chi tiết và báo cáo đầy đủ  
**Thời gian**: ~2-3 phút  
**Sử dụng**:
```bash
./test-full-system.sh
```

**Kiểm tra**:
- 🔥 Health check & connectivity
- 🔑 Authentication testing (register, login)
- 🛡️ RBAC & authorization
- 📊 Pagination với nhiều parameters
- 📁 File upload & data import
- 🔍 Lookup & query testing
- 📤 Export functionality
- ⚡ Performance & edge cases
- 📋 Reports & analytics

**Output**: Colored results với success/failure count

---

### 3. 🧪 `test-load.sh` - Load & Performance Testing
**Mục đích**: Test hiệu năng và khả năng chịu tải  
**Thời gian**: ~3-5 phút  
**Sử dụng**:
```bash
./test-load.sh
```

**Kiểm tra**:
- 🔥 Concurrent requests testing
- 🔐 Authentication load
- 📄 Pagination performance
- 🔍 Lookup query under load
- 📤 Export load testing
- 🌀 Mixed workload simulation

**Metrics**: Requests/second, response times, concurrent user handling

---

### 4. 🔄 `test-e2e.sh` - End-to-End Workflow Test
**Mục đích**: Test complete user journey từ đầu đến cuối  
**Thời gian**: ~2-3 phút  
**Sử dụng**:
```bash
./test-e2e.sh
```

**Workflow**:
1. 🏁 System health check
2. 👤 User registration
3. 🔑 Admin authentication
4. 👥 User management
5. 🔐 Role management
6. 📁 File upload & data import
7. ⏳ Job monitoring
8. 🔍 Data querying
9. 📤 Export workflow
10. 💼 Jobs management
11. 📂 File management
12. 📊 System reports
13. 👥 User export
14. 🧹 Cleanup

---

### 5. 📊 `test-pagination.sh` - Pagination Specific Test
**Mục đích**: Test chi tiết pagination functionality  
**Thời gian**: ~1 phút  
**Sử dụng**:
```bash
./test-pagination.sh
```

**Kiểm tra**:
- Users pagination
- Roles pagination  
- Jobs pagination
- Lookup query pagination
- File listing pagination

---

## 🔧 Requirements

### Prerequisites
- ✅ Server đang chạy trên `http://localhost:3000`
- ✅ Database đã được seed với admin user
- ✅ Admin credentials: `admin@example.com` / `Admin123!`
- ✅ `curl` command available
- ✅ Bash shell environment

### Setup
```bash
# Clone và setup project
git clone <repo>
cd backend

# Install dependencies
yarn install

# Setup database
yarn db:migrate
yarn db:seed

# Start server
yarn start:prod

# Run tests trong terminal khác
./test-quick.sh
```

---

## 📈 Test Results Interpretation

### ✅ Success Indicators
- **Green ✅**: Test passed successfully
- **HTTP 2xx**: API responding correctly
- **Expected data structure**: JSON với correct fields
- **Authentication working**: Access token received
- **Pagination working**: `data`, `total`, `page` fields present

### ⚠️ Warning Indicators  
- **Yellow ⚠️**: Test passed but with warnings
- **403 Forbidden**: Permission issues (expected for some APIs)
- **Empty results**: No data but API structure correct

### ❌ Failure Indicators
- **Red ❌**: Test failed completely
- **HTTP 4xx/5xx**: Server errors
- **Missing access token**: Authentication failed
- **Malformed response**: API structure incorrect

---

## 🎯 Usage Examples

### Quick Development Test
```bash
# Sau khi code changes
yarn build
yarn start:prod

# Test nhanh
./test-quick.sh
```

### Before Production Deployment
```bash
# Full testing suite
./test-full-system.sh
./test-load.sh
./test-e2e.sh
```

### Performance Monitoring
```bash
# Regular performance checks
./test-load.sh > performance_$(date +%Y%m%d).log
```

### CI/CD Integration
```bash
# Trong CI pipeline
./test-full-system.sh
if [ $? -eq 0 ]; then
  echo "All tests passed - proceeding with deployment"
else
  echo "Tests failed - stopping deployment"
  exit 1
fi
```

---

## 🔍 Troubleshooting

### Common Issues

**1. Server not responding**
```bash
# Check if server is running
curl http://localhost:3000/health

# Start server if needed
yarn start:prod
```

**2. Authentication failures**
```bash
# Verify admin user exists
yarn db:seed

# Check credentials in test scripts
```

**3. Permission errors (403)**
- Expected for some admin-only APIs
- Non-admin users should get 403 for protected routes

**4. Empty results**
- Normal if no data uploaded yet
- Upload sample data first:
```bash
curl -X POST "http://localhost:3000/data-import/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample-data.csv"
```

---

## 📊 Test Coverage

| Feature | Quick | Full | Load | E2E |
|---------|-------|------|------|-----|
| Authentication | ✅ | ✅ | ✅ | ✅ |
| Pagination | ✅ | ✅ | ✅ | ✅ |
| RBAC | ⚠️ | ✅ | ❌ | ✅ |
| File Upload | ❌ | ✅ | ❌ | ✅ |
| Export | ✅ | ✅ | ✅ | ✅ |
| Jobs | ✅ | ✅ | ❌ | ✅ |
| Performance | ❌ | ⚠️ | ✅ | ❌ |
| Edge Cases | ❌ | ✅ | ⚠️ | ❌ |

---

## 🚀 Next Steps

1. **Automate with CI/CD**: Integrate vào GitHub Actions/GitLab CI
2. **Monitoring**: Setup với Prometheus/Grafana metrics
3. **Load Balancing**: Test với multiple server instances
4. **Database Performance**: Add database query performance tests
5. **Security Testing**: Add security vulnerability scanning

---

## 📝 Contributing

Để thêm test cases mới:

1. Tạo function test trong script
2. Follow naming convention: `test_feature_description()`
3. Add proper error handling
4. Update documentation
5. Test thoroughly before commit

---

**🎉 Happy Testing! All scripts are ready for comprehensive system validation.**