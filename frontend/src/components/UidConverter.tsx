'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, FileText, Upload } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ConversionResult {
  stt: number
  uid: string
  phone: string
  status: string
  address?: string
  found: boolean
}

interface LookupApiResult {
  uid: string
  phone?: string
  address?: string
  found: boolean
}

export default function UidConverter() {
  const { user, logout } = useAuth()
  const [inputType, setInputType] = useState<'single' | 'multiple'>('single')
  const [singleUid, setSingleUid] = useState('')
  const [multipleUids, setMultipleUids] = useState('')
  const [results, setResults] = useState<ConversionResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Mock API stats
  const apiStats = {
    key: "ea9f7d6e-1b53-4a7f-8361-70831ff54ea1",
    used: 100,
    total: 10000,
    remaining: 2848,
    percentage: 1
  }

  const handleConvert = async () => {
    setIsLoading(true)
    
    try {
      const uids = inputType === 'single' 
        ? [singleUid] 
        : multipleUids.split('\n').filter(uid => uid.trim())
      
      if (uids.length === 0) {
        setResults([])
        setIsLoading(false)
        return
      }

      // Gọi API backend để lookup
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ uids: uids.map(uid => uid.trim()) }),
      })
      console.log('Lookup response:', response)

      if (response.ok) {
        const data = await response.json()
        
        // Chuyển đổi kết quả từ backend sang format frontend
        const convertedResults: ConversionResult[] = data.results.map((result: LookupApiResult, index: number) => ({
          stt: index + 1,
          uid: result.uid || uids[index],
          phone: result.phone || '',
          status: result.phone ? 'Tìm thấy' : 'Không tìm thấy',
          address: result.address || '',
          found: result.found
        }))
        
        setResults(convertedResults)
      }
    } catch (error) {
      console.error('Convert error:', error)
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
            const headerRow = jsonData[0] as any[]
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
            jsonData.slice(1).forEach((row: any) => {
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
          
          setMultipleUids(content)
          setInputType('multiple')
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
      ['uid'],  // Header
      ['100000123456789'],
      ['100000987654321'],
      ['100000555666777'],
      ['100000111222333']
    ]
    
    // Tạo worksheet và workbook
    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'UIDs')
    
    // Xuất file Excel
    XLSX.writeFile(workbook, 'template-uid-2025-10-07T14-45-07.xlsx')
  }

  const exportResults = () => {
    if (results.length === 0) return
    
    const csvContent = [
      'STT,UID,Số điện thoại',
      ...results.map(result => `${result.stt},${result.uid},${result.phone}`)
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ket-qua-chuyen-doi.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
            <span className="text-blue-600 cursor-pointer">Chuyển đổi UID</span>
            <span className="text-gray-500">Kiểm tra Zalo</span>
            <span className="text-gray-600">Xin chào, {user?.name || 'User'}</span>
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
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
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
            </div>

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
                            Chọn file khác
                          </Button>
                        </div>
                        
                        <Button variant="outline" size="sm" onClick={downloadTemplate}>
                          <Download className="w-4 h-4 mr-2" />
                          Tải xuống template
                        </Button>
                      </div>
                      
                      <div className="text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded bg-green-50 text-green-700 text-sm">
                          <FileText className="w-4 h-4 mr-1" />
                          template-uid-2025-10-07T14-45-07.xlsx
                        </div>
                        <div className="text-xs text-gray-500 mt-1">✓ Đã lưu {results.length} UID từ file</div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button onClick={handleConvert} disabled={isLoading} className="flex-1">
                      {isLoading ? 'Đang xử lý...' : 'Chuyển đổi'}
                    </Button>
                    <Button variant="outline">Xóa file</Button>
                    <Button variant="outline">Chọn file khác</Button>
                  </div>
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
                        Tải xuống
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Đã chuyển đổi {results.length} UID thành công</p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-16">STT</TableHead>
                          <TableHead>UID</TableHead>
                          <TableHead>Số điện thoại</TableHead>
                          <TableHead>Địa chỉ</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result) => (
                          <TableRow key={result.stt}>
                            <TableCell>{result.stt}</TableCell>
                            <TableCell className="font-mono text-sm">{result.uid}</TableCell>
                            <TableCell>{result.phone || '–'}</TableCell>
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