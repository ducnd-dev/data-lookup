'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, FileText, Upload, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { apiCall } from '@/utils/apiUtils'
import Link from 'next/link'

interface ConversionResult {
  stt: number
  uid: string
  phone: string
  name?: string
  status: string
  address?: string
  found: boolean
}

interface LookupApiResult {
  uid: string
  phone?: string
  name?: string
  address?: string
  found: boolean
}

type ExcelCellValue = string | number | null | undefined
type ExcelRow = ExcelCellValue[]
type ExcelData = ExcelRow[]

export default function UidConverter() {
  const { user, logout } = useAuth()
  const [inputType, setInputType] = useState<'single' | 'multiple'>('single')
  const [singleUid, setSingleUid] = useState('')
  const [multipleUids, setMultipleUids] = useState('')
  const [results, setResults] = useState<ConversionResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploadedUidCount, setUploadedUidCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filterStatus, setFilterStatus] = useState<'all' | 'found' | 'not-found'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock API stats
  const apiStats = {
    key: "ea9f7d6e-1b53-4a7f-8361-70831ff54ea1",
    used: 100,
    total: 10000,
    remaining: 2848,
    percentage: 1
  }

  // Filter and pagination logic
  const filteredResults = results.filter(result => {
    // Filter by status
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'found' && result.found) ||
      (filterStatus === 'not-found' && !result.found)
    
    // Filter by search term (UID, phone, name)
    const searchMatch = searchTerm === '' ||
      result.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (result.name && result.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return statusMatch && searchMatch
  })

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage)

  // Reset to first page when filters change
  const handleFilterChange = (newFilter: 'all' | 'found' | 'not-found') => {
    setFilterStatus(newFilter)
    setCurrentPage(1)
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleConvert = async () => {
    setIsLoading(true)
    setErrorMessage('') // Clear previous errors
    setSuccessMessage('') // Clear previous success messages
    
    try {
      const uids = inputType === 'single' 
        ? [singleUid] 
        : multipleUids.split('\n').filter((uid: string) => uid.trim())
      
      if (uids.length === 0) {
        setResults([])
        setIsLoading(false)
        return
      }

      // Gọi API backend để lookup sử dụng utility function
      const response = await apiCall<{ results: LookupApiResult[] }>(
        '/api/lookup',
        {
          method: 'POST',
          body: JSON.stringify({ uids: uids.map((uid: string) => uid.trim()) }),
        },
        logout // Pass logout function for 401 handling
      )

      if (response.success && response.data) {
        // Chuyển đổi kết quả từ backend sang format frontend
        const convertedResults: ConversionResult[] = response.data.results.map((result: LookupApiResult, index: number) => ({
          stt: index + 1,
          uid: result.uid || uids[index],
          phone: result.phone || '',
          name: result.name || '',
          status: result.phone ? 'Tìm thấy' : 'Không tìm thấy',
          address: result.address || '',
          found: result.found
        }))
        
        setResults(convertedResults)
        
        // Reset pagination when new results come in
        setCurrentPage(1)
        
        // Hiển thị thông báo thành công
        const foundCount = convertedResults.filter(result => result.found).length
        const totalCount = convertedResults.length
        setSuccessMessage(
          `Chuyển đổi thành công! Tìm thấy ${foundCount}/${totalCount} UID (${Math.round((foundCount/totalCount) * 100)}%)`
        )
      } else {
        // Handle API errors (will not include 401 as it's handled by apiCall)
        if (response.status !== 401) {
          setErrorMessage(response.error || 'Có lỗi xảy ra khi gọi API')
        }
      }
    } catch (error) {
      console.error('Convert error:', error)
      setErrorMessage('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Xử lý file Excel
        const reader = new FileReader()
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer
          
          // Import xlsx library dynamically
          const XLSX = await import('xlsx')
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          // Lấy dữ liệu từ cột có header "uid"
          const uids: string[] = []
          
          if (jsonData.length > 0) {
            // Tìm index của cột "uid" từ header row
            const headerRow = jsonData[0] as ExcelRow
            let uidColumnIndex = -1
            
            if (Array.isArray(headerRow)) {
              uidColumnIndex = headerRow.findIndex(cell => 
                String(cell).toLowerCase().trim() === 'uid'
              )
            }
            
            // Nếu không tìm thấy cột "uid", mặc định dùng cột đầu tiên
            if (uidColumnIndex === -1) {
              uidColumnIndex = 0
            }
            
            // Lấy dữ liệu từ cột đã xác định, bỏ qua header
            (jsonData.slice(1) as ExcelData).forEach((row) => {
              if (Array.isArray(row) && row[uidColumnIndex]) {
                const cellValue = String(row[uidColumnIndex]).trim()
                if (cellValue) {
                  uids.push(cellValue)
                }
              }
            })
          }
          
          setMultipleUids(uids.join('\n'))
          setInputType('multiple')
          setUploadedFileName(file.name)
          setUploadedUidCount(uids.length)
        }
        reader.readAsArrayBuffer(file)
      } else {
        // Xử lý file text (.txt, .csv)
        const reader = new FileReader()
        reader.onload = (e) => {
          let content = e.target?.result as string
          
          // Nếu là CSV, tìm và chỉ lấy cột "uid"
          if (fileExtension === 'csv') {
            const lines = content.split('\n')
            const uids: string[] = []
            
            if (lines.length > 0) {
              // Tìm index của cột "uid" từ header row
              const headerLine = lines[0]
              const headers = headerLine.split(',').map(h => h.trim().toLowerCase())
              let uidColumnIndex = headers.findIndex(header => header === 'uid')
              
              // Nếu không tìm thấy cột "uid", mặc định dùng cột đầu tiên
              if (uidColumnIndex === -1) {
                uidColumnIndex = 0
              }
              
              // Lấy dữ liệu từ cột đã xác định, bỏ qua header
              lines.slice(1).forEach(line => {
                const columns = line.split(',')
                const cellValue = columns[uidColumnIndex]?.trim()
                if (cellValue) {
                  uids.push(cellValue)
                }
              })
              
              content = uids.join('\n')
            }
          }
          
          // Count UIDs after processing
          const finalUids = content.split('\n').filter(uid => uid.trim()).length
          
          setMultipleUids(content)
          setInputType('multiple')
          setUploadedFileName(file.name)
          setUploadedUidCount(finalUids)
        }
        reader.readAsText(file)
      }
    }
  }

  const downloadTemplate = async () => {
    // Import xlsx library dynamically
    const XLSX = await import('xlsx')
    
    // Tạo dữ liệu template
    const templateData = [
      ['uid', 'name'],  // Header
      ['100000123456789', 'Nguyễn Văn A'],
      ['100000987654321', 'Trần Thị B'],
      ['100000555666777', 'Lê Văn C'],
      ['100000111222333', 'Phạm Thị D']
    ]
    
    // Tạo worksheet và workbook
    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'UIDs')
    
    // Xuất file Excel
    XLSX.writeFile(workbook, 'template-uid-2025-10-07T14-45-07.xlsx')
  }

  const exportResults = async () => {
    if (results.length === 0) return
    
    // Chỉ xuất những kết quả tìm được (found: true)
    const foundResults = results.filter(result => result.found)
    
    if (foundResults.length === 0) {
      alert('Không có kết quả nào để xuất. Chỉ xuất các UID đã chuyển đổi thành công.')
      return
    }

    // Import xlsx library dynamically
    const XLSX = await import('xlsx')
    
    // Tạo dữ liệu Excel với chỉ các kết quả tìm được
    const excelData = foundResults.map((result) => ({
      'uid': result.uid,
      'phone': result.phone,
      'name': result.name || '',
      'address': result.address || '',
    }))
    
    // Tạo worksheet và workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả chuyển đổi')
    
    // Tạo tên file với timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const fileName = `ket-qua-chuyen-doi-${timestamp}.xlsx`
    
    // Xuất file Excel
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Chuyển đổi UID sang Số điện thoại</h1>
          </div>
          <div className="flex items-center space-x-4 text-sm">
          
            <span className="text-gray-600">Xin chào, {user?.name || 'User'}</span>
            <Link 
              href="/change-password"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              Đổi mật khẩu
            </Link>
            <button 
              onClick={logout}
              className="text-red-500 hover:text-red-700 cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg">Chuyển đổi UID sang Số điện thoại</CardTitle>
            <p className="text-center text-sm text-gray-600">
              Công cụ chuyển đổi UID Facebook thành số điện thoại nhanh chóng và chính xác
            </p>
          </CardHeader>
          <CardContent>
            {/* API Key Section */}
            {/* <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-sm font-medium mb-2">API KEY:</div>
                <div className="font-mono text-sm bg-white px-3 py-1 rounded border inline-block">
                  {apiStats.key}
                </div>
              </div>
              
              <div className="flex justify-center items-center space-x-8 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{apiStats.total.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Giới hạn</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{apiStats.used}</div>
                  <div className="text-xs text-gray-500">Đã dùng</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{apiStats.remaining.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Còn lại</div>
                </div>
              </div>
              
              <div className="text-center mt-3">
                <Button variant="outline" size="sm" className="text-blue-600">
                  Hướng dẫn sử dụng API KEY
                </Button>
              </div>
            </div> */}

            {/* Input Section */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Nhập UID để chuyển đổi
                </CardTitle>
                <p className="text-sm text-gray-600">Chọn phương thức nhập UID phù hợp với bạn</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Input Type Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      variant={inputType === 'single' ? 'default' : 'outline'}
                      onClick={() => setInputType('single')}
                      size="sm"
                    >
                      Nhập thủ công
                    </Button>
                    <Button
                      variant={inputType === 'multiple' ? 'default' : 'outline'}
                      onClick={() => setInputType('multiple')}
                      size="sm"
                    >
                      Tải file Excel
                    </Button>
                  </div>

                  {inputType === 'single' ? (
                    <div>
                      <Input
                        placeholder="Nhập UID cần chuyển đổi..."
                        value={singleUid}
                        onChange={(e) => setSingleUid(e.target.value)}
                        className="mb-3"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Nhập nhiều UID, mỗi UID một dòng..."
                        value={multipleUids}
                        onChange={(e) => setMultipleUids(e.target.value)}
                        rows={6}
                        className="mb-3"
                      />
                      
                      {/* File Upload and Template */}
                      <div className="flex space-x-3">
                        <div className="relative">
                          <input
                            type="file"
                            accept=".txt,.csv,.xlsx"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4 mr-2" />
                            Chọn file
                          </Button>
                        </div>
                        
                        <Button variant="outline" size="sm" onClick={downloadTemplate}>
                          <Download className="w-4 h-4 mr-2" />
                          Tải xuống template
                        </Button>
                      </div>
                      
                      {/* Display uploaded file info */}
                      {uploadedFileName && uploadedUidCount > 0 && (
                        <div className="text-center">
                          <div className="inline-flex items-center px-3 py-1 rounded bg-green-50 text-green-700 text-sm">
                            <FileText className="w-4 h-4 mr-1" />
                            {uploadedFileName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">✓ Đã tải {uploadedUidCount} UID từ file</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button onClick={handleConvert} disabled={isLoading} className="flex-1">
                      {isLoading ? 'Đang xử lý...' : 'Chuyển đổi'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setMultipleUids('')
                        setUploadedFileName('')
                        setUploadedUidCount(0)
                        setErrorMessage('') // Clear error when clearing data
                        setSuccessMessage('') // Clear success message when clearing data
                        setResults([]) // Clear results
                        setCurrentPage(1) // Reset pagination
                        setFilterStatus('all') // Reset filter
                        setSearchTerm('') // Clear search
                      }}
                    >
                      Xóa dữ liệu
                    </Button>
                  </div>

                  {/* Error Message Display */}
                  {errorMessage && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-700 text-sm font-medium">Lỗi:</span>
                      </div>
                      <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {results.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      📞 Kết quả chuyển đổi
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportResults}>
                        <Download className="w-4 h-4 mr-1" />
                        Tải xuống Excel ({results.filter(r => r.found).length} tìm thấy)
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Đã chuyển đổi {results.length} UID thành công</p>
                </CardHeader>
                <CardContent>
                  {/* Success Message Display - Above Table */}
                  {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-700 text-sm font-medium">Kết quả:</span>
                      </div>
                      <p className="text-green-600 text-sm mt-1">{successMessage}</p>
                    </div>
                  )}

                  {/* Filters and Search */}
                  <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      {/* Search Input */}
                      <Input
                        placeholder="Tìm kiếm UID, SĐT, tên..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full sm:w-64"
                      />
                      
                      {/* Status Filter */}
                      <div className="flex gap-1">
                        <Button
                          variant={filterStatus === 'all' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleFilterChange('all')}
                        >
                          Tất cả ({results.length})
                        </Button>
                        <Button
                          variant={filterStatus === 'found' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleFilterChange('found')}
                        >
                          Tìm thấy ({results.filter(r => r.found).length})
                        </Button>
                        <Button
                          variant={filterStatus === 'not-found' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleFilterChange('not-found')}
                        >
                          Không tìm thấy ({results.filter(r => !r.found).length})
                        </Button>
                      </div>
                    </div>

                    {/* Items per page selector */}
                    <div className="flex items-center gap-2 text-sm">
                      <span>Hiển thị:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="border rounded px-2 py-1"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>/ trang</span>
                    </div>
                  </div>

                  {/* Results info */}
                  <div className="mb-3 text-sm text-gray-600">
                    Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredResults.length)} 
                    trong tổng số {filteredResults.length} kết quả
                    {filteredResults.length !== results.length && ` (đã lọc từ ${results.length})`}
                  </div>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-16">STT</TableHead>
                          <TableHead>UID</TableHead>
                          <TableHead>Số điện thoại</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Địa chỉ</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedResults.map((result) => (
                          <TableRow key={result.stt}>
                            <TableCell>{result.stt}</TableCell>
                            <TableCell className="font-mono text-sm">{result.uid}</TableCell>
                            <TableCell>{result.phone || '–'}</TableCell>
                            <TableCell>{result.name || '–'}</TableCell>
                            <TableCell>{result.address || '–'}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                                {result.found ? '✅ Tìm thấy' : '❌ Không tìm thấy'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Trang {currentPage} / {totalPages}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          Đầu
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Trước
                        </Button>
                        
                        {/* Page numbers */}
                        <div className="flex space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Tiếp
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          Cuối
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 text-sm text-gray-500">
                    Đã nhập: {results.length} UID • ❌ Xóa lịch sử
                  </div>
                  
                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm">
                      🔄 Chuyển đổi ({results.length})
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}