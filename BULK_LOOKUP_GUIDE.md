## 🔍 **BULK LOOKUP - User Guide**

### **Tính năng Bulk Lookup dùng để làm gì?**

**Bulk Lookup** cho phép bạn **tìm kiếm nhiều giá trị cùng một lúc** thay vì phải search từng cái một.

### **📋 Use Cases thực tế:**

1. **Email Marketing:**
   - Paste danh sách 100 email addresses 
   - Tìm xem khách hàng nào đã có trong database
   - Xác định prospect mới vs existing customers

2. **Customer Support:**
   - Copy danh sách customer IDs từ ticket system
   - Bulk check customer details và status
   - Cross-reference multiple accounts

3. **Data Validation:**
   - Upload CSV với 1000 product codes
   - Validate xem sản phẩm nào còn tồn tại
   - Identify missing or outdated records

4. **Sales Operations:**
   - Import lead list từ CRM
   - Check contact information accuracy
   - Merge duplicate customer data

### **🚀 Cách sử dụng:**

#### **Step 1: Prepare your search list**
```
DATA1
DATA2
DATA3
user@example.com
another@email.com
PRODUCT123
CUSTOMER456
```

#### **Step 2: Choose search settings**
- **Search Column:** Chọn cột muốn search (colA, colB, colC)
- **Search Mode:** 
  - `Exact` - Tìm chính xác (user@example.com)
  - `Partial` - Tìm chứa từ khóa (tìm "john" sẽ ra "john.doe@email.com")
  - `Fuzzy` - Tìm tương tự (cho phép lỗi chính tả)

#### **Step 3: View results**
- Thấy tất cả matches cho các search terms
- Match score % cho từng result
- Export results to CSV if needed

### **💡 Pro Tips:**

1. **Paste from Excel:** Copy cột từ Excel và paste trực tiếp
2. **CSV Upload:** Use "Load CSV for Bulk Search" để load file
3. **Large lists:** System handle được thousands of values
4. **Search optimization:** Use "Exact" cho fastest results

### **🔄 Workflow Example:**

```
Input:
DATA1
DATA2
DATA5
UNKNOWN123

Results:
✅ DATA1 - Found (100% match)
✅ DATA2 - Found (100% match)  
✅ DATA5 - Found (100% match)
❌ UNKNOWN123 - Not found (0% match)

Summary: 3/4 found, 1 missing
```

### **🆚 Bulk Lookup vs Single Search:**

| **Feature** | **Single Search** | **Bulk Lookup** |
|-------------|-------------------|------------------|
| **Input** | 1 value | Multiple values |
| **Time** | Fast per query | Efficient for many |
| **Use case** | Quick checks | Batch processing |
| **Results** | Individual | Consolidated view |

**Bulk Lookup saves massive time when working with lists!** 🎯