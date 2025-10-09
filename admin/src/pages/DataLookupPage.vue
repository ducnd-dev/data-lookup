<template>
  <PageWrapper>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Tra Cứu Dữ Liệu</h1>
          <p class="mt-2 text-sm text-gray-700">Tìm kiếm và truy xuất dữ liệu từ hồ sơ của bạn</p>
        </div>
      </div>

      <!-- Lookup Sections -->
      <div class="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
        <!-- Single Lookup -->
        <n-card>
          <template #header>
            <div class="flex items-center gap-2">
              <n-icon size="20" class="text-blue-500">
                <Search />
              </n-icon>
              <span class="font-semibold">Tra Cứu Đơn</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">Tìm kiếm từng bản ghi cá nhân</p>
          </template>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Giá Trị Tìm Kiếm</label>
              <n-input v-model:value="singleLookup.searchValue" placeholder="Nhập giá trị cần tìm..." clearable
                size="large" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cột Tìm Kiếm</label>
              <n-select v-model:value="singleLookup.searchColumn" placeholder="Chọn cột" :options="columnOptions"
                size="large" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Chế Độ Tìm Kiếm</label>
              <n-select v-model:value="singleLookup.searchMode" :options="searchModeOptions" size="large" />
              <div class="text-xs text-gray-500 mt-1">
                {{ searchModeOptions.find(opt => opt.value === singleLookup.searchMode)?.description }}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Lọc Theo Ngày Tạo</label>
              <n-date-picker
                v-model:value="singleLookup.dateRange"
                type="daterange"
                clearable
                size="large"
                placeholder="Chọn khoảng thời gian"
                format="dd/MM/yyyy"
                class="w-full"
              />
              <div class="text-xs text-gray-500 mt-1">
                Để trống để tìm kiếm tất cả thời gian
              </div>
            </div>

            <n-button type="primary" size="large" block :loading="singleSearching" @click="performSingleSearch">
              <template #icon>
                <n-icon>
                  <Search />
                </n-icon>
              </template>
              Tìm Kiếm
            </n-button>
          </div>
        </n-card>

        <!-- Bulk Lookup -->
        <n-card>
          <template #header>
            <div class="flex items-center gap-2">
              <n-icon size="20" class="text-orange-500">
                <DocumentText />
              </n-icon>
              <span class="font-semibold">Tra Cứu Hàng Loạt</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">Tìm kiếm nhiều giá trị cùng lúc - hoàn hảo cho:</p>
            <ul class="text-xs text-gray-500 mt-1 ml-4 list-disc">
              <li>Tìm nhiều địa chỉ email, ID người dùng hoặc mã sản phẩm</li>
              <li>Đối chiếu danh sách từ file Excel/CSV</li>
              <li>Xác thực dữ liệu khách hàng hàng loạt</li>
            </ul>
          </template>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Giá Trị Cần Tìm
                <span class="text-xs text-gray-500 ml-1">(dán hoặc nhập mỗi giá trị một dòng)</span>
              </label>
              <n-input v-model:value="bulkLookup.values" type="textarea"
                placeholder="Nhập nhiều giá trị cần tìm (mỗi giá trị một dòng):&#10;&#10;USR001&#10;USR002&#10;USR003&#10;+1234567890&#10;+1234567891&#10;&#10;💡 Hoàn hảo cho việc tìm kiếm nhiều User ID, số điện thoại hoặc địa chỉ cùng lúc!"
                :autosize="{ minRows: 6, maxRows: 10 }" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cột Tìm Kiếm</label>
              <n-select v-model:value="bulkLookup.searchColumn" placeholder="Chọn cột" :options="columnOptions"
                size="large" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Chế Độ Tìm Kiếm</label>
              <n-select v-model:value="bulkLookup.searchMode" :options="searchModeOptions" size="large" />
              <div class="text-xs text-gray-500 mt-1">
                {{ searchModeOptions.find(opt => opt.value === bulkLookup.searchMode)?.description }}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Lọc Theo Ngày Tạo</label>
              <n-date-picker
                v-model:value="bulkLookup.dateRange"
                type="daterange"
                clearable
                size="large"
                placeholder="Chọn khoảng thời gian"
                format="dd/MM/yyyy"
                class="w-full"
              />
              <div class="text-xs text-gray-500 mt-1">
                Để trống để tìm kiếm tất cả thời gian
              </div>
            </div>

            <n-button type="warning" size="large" block :loading="bulkSearching" :disabled="!bulkLookup.values.trim()"
              @click="performBulkSearch">
              <template #icon>
                <n-icon>
                  <PlayCircle />
                </n-icon>
              </template>
              Bắt Đầu Tra Cứu Hàng Loạt
            </n-button>
          </div>
        </n-card>

        <!-- Data Management -->
        <n-card v-if="canUpload">
          <template #header>
            <div class="flex items-center gap-2">
              <n-icon size="20" class="text-green-500">
                <CloudUpload />
              </n-icon>
              <span class="font-semibold">Quản Lý Dữ Liệu</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">Tải lên và quản lý các file dữ liệu của bạn</p>
          </template>

          <div class="space-y-4">
            <!-- Upload buttons section -->
            <div class="flex gap-3 flex-wrap">
              <n-button type="primary" ghost @click="triggerFileUpload">
                <template #icon>
                  <n-icon>
                    <CloudUpload />
                  </n-icon>
                </template>
                Tải CSV Cho Tra Cứu Hàng Loạt
              </n-button>
              <n-button type="primary" @click="triggerDataUpload">
                <template #icon>
                  <n-icon>
                    <DatabaseIcon />
                  </n-icon>
                </template>
                Tải Lên Cơ Sở Dữ Liệu
              </n-button>
            </div>

            <div class="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <p class="font-medium">💡 Hai chức năng khác nhau:</p>
              <ul class="mt-1 ml-4 list-disc space-y-1">
                <li><strong>Tải CSV Cho Tra Cứu Hàng Loạt:</strong> Tải giá trị từ CSV để tìm kiếm trong dữ liệu hiện có</li>
                <li><strong>Tải Lên Cơ Sở Dữ Liệu:</strong> Thêm các bản ghi dữ liệu mới vào hệ thống</li>
              </ul>
            </div>
          </div>
        </n-card>

        <!-- Message for users without upload permission -->
        <n-card v-if="!canUpload">
          <template #header>
            <div class="flex items-center gap-2">
              <n-icon size="20" class="text-gray-400">
                <FunnelOutline />
              </n-icon>
              <span class="font-semibold text-gray-600">Quản Lý Dữ Liệu</span>
            </div>
          </template>

          <n-alert type="info">
            <template #icon>
              <n-icon>
                <FunnelOutline />
              </n-icon>
            </template>
            Chỉ có Quản trị viên và Người quản lý mới có thể tải lên file và quản lý dữ liệu
          </n-alert>
        </n-card>
      </div>

      <!-- Results Section -->
      <n-card v-if="searchResults.length > 0">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <n-icon size="20" class="text-green-500">
                <CheckmarkCircle />
              </n-icon>
              <span class="font-semibold">Kết Quả Tra Cứu</span>
              <n-tag size="small" type="info">
                Tìm thấy {{ totalResults }} kết quả phù hợp
              </n-tag>
            </div>
            <div class="flex gap-2">
              <n-button type="primary" size="small" @click="exportResults">
                <template #icon>
                  <n-icon>
                    <Download />
                  </n-icon>
                </template>
                Xuất Kết Quả
              </n-button>
              <n-button type="default" size="small" @click="clearResults">
                <template #icon>
                  <n-icon>
                    <CheckmarkCircle />
                  </n-icon>
                </template>
                Xóa Kết Quả
              </n-button>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <n-data-table
            :key="`pagination-${currentPage}-${pageSize}-${totalResults}`"
            :columns="resultColumns"
            :data="paginatedResults"
            :pagination="false"
            :loading="singleSearching || bulkSearching"
            size="small"
            :scroll-x="800"
          />

          <!-- Custom pagination with enhanced styling -->
          <div class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
            <n-pagination
              v-model:page="currentPage"
              v-model:page-size="pageSize"
              :page-count="totalPages"
              :page-sizes="[
                { label: '10 / trang', value: 10 },
                { label: '20 / trang', value: 20 },
                { label: '50 / trang', value: 50 },
                { label: '100 / trang', value: 100 }
              ]"
              :show-size-picker="true"
              :show-quick-jumper="true"
              :show-quick-jump-dropdown="true"
              :disabled="singleSearching || bulkSearching"
              :page-slot="7"
              size="medium"
              class="justify-center flex-wrap"
              @update:page="handlePageChange"
              @update:page-size="handlePageSizeChange"
            >
              <template #prefix="{ startIndex, endIndex, itemCount }">
                <div class="text-sm text-gray-700 mr-2 sm:mr-4 mb-2 sm:mb-0">
                  <span class="hidden sm:inline">Hiển thị </span>
                  <span class="font-semibold text-blue-700">{{ startIndex }}-{{ endIndex }}</span>
                  <span class="hidden sm:inline"> trong tổng số </span>
                  <span class="sm:hidden">/</span>
                  <span class="font-semibold text-blue-700">{{ itemCount || 0 }}</span>
                  <span class="hidden sm:inline"> kết quả</span>
                </div>
              </template>
              <template #suffix="{ page, pageCount }">
                <div class="text-sm text-gray-600 ml-2 sm:ml-4 mt-2 sm:mt-0">
                  <span class="px-2 py-1 bg-white rounded-md shadow-sm border">
                    Trang {{ page }}/{{ pageCount }}
                  </span>
                </div>
              </template>
              <template #goto>
                <span class="text-sm text-gray-700 font-medium">Đến:</span>
              </template>
            </n-pagination>


          </div>
        </div>
      </n-card>

      <!-- Hidden file input for CSV upload -->
      <input ref="fileInputRef" type="file" accept=".csv,.txt" style="display: none" @change="handleFileUpload" />

      <!-- Hidden file input for database upload -->
      <input ref="dataUploadInputRef" type="file" accept=".csv,.xlsx,.xls" style="display: none" @change="handleDataUpload" />

    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import {
  CheckmarkCircle,
  CloudUpload,
  DocumentText,
  Download,
  FunnelOutline,
  PlayCircle,
  Search,
  Server as DatabaseIcon
} from '@vicons/ionicons5'
import {
  NAlert, NButton, NCard, NDataTable, NDatePicker,
  NIcon,
  NInput,
  NPagination,
  NSelect,
  NTag,
  useMessage, type DataTableColumns
} from 'naive-ui'
import { computed, h, ref, watch } from 'vue'
import PageWrapper from '../components/common/PageWrapper.vue'
import uploadApi from '../services/uploadApi'
import { lookupApi, type QueryLookupRequest, type LookupResult, type BulkSearchRequest, type ExportSearchResultsRequest } from '../services/lookupApi'
import { useApi } from '../composables/useApi'
import { usePermissions } from '../composables/usePermissions'

interface SearchResult {
  id: string | number
  [key: string]: unknown
  matchScore?: string
}

const message = useMessage()

// Permissions
const { canUpload } = usePermissions()

// API composables
const { data: singleSearchData, loading: singleSearching, error: singleSearchError, execute: executeSingleSearch } = useApi(lookupApi.queryLookup)
const { data: bulkSearchData, loading: bulkSearching, error: bulkSearchError, execute: executeBulkSearch } = useApi(lookupApi.bulkSearch)

// State
const searchResults = ref<SearchResult[]>([])
const fileInputRef = ref<HTMLInputElement>()
const dataUploadInputRef = ref<HTMLInputElement>()
const currentPage = ref(1)
const pageSize = ref(10)
const totalResults = ref(0) // Total từ API response
const isSearching = ref(false) // Để track search state
const isPaginationChange = ref(false) // Track if this is a pagination change vs new search
const totalPages = computed(() => Math.ceil(totalResults.value / pageSize.value))
// Form data
const singleLookup = ref({
  searchValue: '',
  searchColumn: 'uid', // Mặc định cột đầu tiên
  searchMode: 'partial' as 'exact' | 'partial' | 'fuzzy',
  dateRange: null as [number, number] | null // [startDate, endDate] timestamps
})

const bulkLookup = ref({
  values: '',
  searchColumn: 'uid',
  searchMode: 'partial' as 'exact' | 'partial' | 'fuzzy',
  dateRange: null as [number, number] | null
})

// Tùy chọn - có thể lấy từ API
// Định nghĩa các cột có thể tìm kiếm
const columnOptions = [
  { label: 'User ID', value: 'uid' },
  { label: 'Phone Number', value: 'phone' },
  { label: 'Address', value: 'address' }
]

// Tùy chọn chế độ tìm kiếm
const searchModeOptions = [
  { label: 'Khớp Một Phần', value: 'partial', description: 'Tìm văn bản chứa từ khóa của bạn' },
  { label: 'Khớp Chính Xác', value: 'exact', description: 'Chỉ tìm kết quả khớp hoàn toàn' },
  { label: 'Tìm Kiếm Mờ', value: 'fuzzy', description: 'Tìm văn bản tương tự (cho phép lỗi chính tả)' }
]



// Computed
const paginatedResults = computed(() => {
  // Since we're using server-side pagination, searchResults already contains
  // only the data for the current page from the API
  console.log('Computed paginatedResults - searchResults length:', searchResults.value.length)
  console.log('Current page data:', searchResults.value)
  return searchResults.value
})

// Dynamic table columns based on search results
const resultColumns = computed<DataTableColumns<SearchResult>>(() => {
  const columns: DataTableColumns<SearchResult> = []

  // If we have results, create columns dynamically
  if (searchResults.value.length > 0) {
    const firstResult = searchResults.value[0]

    // Add columns for each property except internal ones
    if (firstResult) {
      Object.keys(firstResult).forEach(key => {
        if (key !== 'id' && key !== 'matchScore') {
          // Custom title mapping for better display
          let title = key.charAt(0).toUpperCase() + key.slice(1)
          if (key === 'uid') title = 'User ID'
          else if (key === 'phone') title = 'Phone Number'
          else if (key === 'address') title = 'Address'
          else if (key === 'createdAt') title = 'Created At'
          else if (key === 'updatedAt') title = 'Updated At'

          columns.push({
            title,
            key: key,
            width: key === 'address' ? 300 : (key === 'phone' ? 150 : 120),
            ellipsis: true
          })
        }
      })

      // Thêm cột điểm khớp nếu có
      if (firstResult.matchScore !== undefined) {
        columns.push({
          title: 'Điểm Khớp',
          key: 'matchScore',
          width: 100,
          render: (row: SearchResult) => {
            const score = row.matchScore as string
            const numScore = parseInt(score.replace('%', ''))
            let type: 'success' | 'warning' | 'error' | 'info' = 'info'

            if (numScore === 100) type = 'success'
            else if (numScore >= 80) type = 'info'
            else if (numScore >= 60) type = 'warning'
            else type = 'error'

            return h(NTag, { type }, { default: () => score })
          }
        })
      }
    }
  } else {
    // Default columns when no results
    columns.push(
      {
        title: 'User ID',
        key: 'uid',
        width: 200
      },
      {
        title: 'Phone Number',
        key: 'phone',
        width: 200
      },
      {
        title: 'Address',
        key: 'address',
        width: 300
      }
    )
  }

  return columns
})

// Hàm hỗ trợ tính điểm khớp
function calculateMatchScore(searchTerm: string, foundValue: unknown, searchMode: 'exact' | 'partial' | 'fuzzy'): string {
  if (!foundValue || typeof foundValue !== 'string') return '0%'

  const search = searchTerm.toLowerCase().trim()
  const found = String(foundValue).toLowerCase().trim()

  // Exact match
  if (search === found) return '100%'

  // Calculate similarity based on search mode
  switch (searchMode) {
    case 'exact':
      return search === found ? '100%' : '0%'

    case 'partial':
      if (found.includes(search)) {
        const ratio = search.length / found.length
        const score = Math.round(80 + (ratio * 20)) // 80-100% for partial matches
        return `${Math.min(score, 99)}%` // Cap at 99% for partial matches
      }
      return '0%'

    case 'fuzzy':
      // Simple fuzzy matching based on character overlap
      let matches = 0
      const searchChars = search.split('')
      const foundChars = found.split('')

      searchChars.forEach(char => {
        const index = foundChars.indexOf(char)
        if (index !== -1) {
          matches++
          foundChars.splice(index, 1) // Remove matched character
        }
      })

      const score = Math.round((matches / search.length) * 100)
      return `${Math.max(score, 0)}%`

    default:
      return '0%'
  }
}

// Watch for pagination changes to debug
watch([currentPage, pageSize, totalResults], ([newPage, newPageSize, newTotal]) => {
  console.log('Pagination state changed:', {
    currentPage: newPage,
    pageSize: newPageSize,
    totalResults: newTotal
  })
}, { immediate: true })

// Methods
function handlePageChange(page: number) {
  currentPage.value = page
  isPaginationChange.value = true
  if (searchResults.value.length > 0) {
    if (bulkLookup.value.values.trim()) {
      performBulkSearch()
    } else if (singleLookup.value.searchValue.trim()) {
      performSingleSearch()
    }
  }
}

function handlePageSizeChange(newPageSize: number) {
  pageSize.value = newPageSize
  currentPage.value = 1
  isPaginationChange.value = true
  if (searchResults.value.length > 0) {
    if (bulkLookup.value.values.trim()) {
      performBulkSearch()
    } else if (singleLookup.value.searchValue.trim()) {
      performSingleSearch()
    }
  }
}

function resetPagination() {
  currentPage.value = 1
  totalResults.value = 0
  searchResults.value = []
}

function clearResults() {
  resetPagination()
  isPaginationChange.value = false // Reset pagination change flag
  singleLookup.value.searchValue = ''
  singleLookup.value.dateRange = null
  bulkLookup.value.values = ''
  bulkLookup.value.dateRange = null
  message.info('Đã xóa tất cả kết quả tìm kiếm')
}

async function performSingleSearch() {
  if (!singleLookup.value.searchValue.trim()) {
    message.error('Vui lòng nhập giá trị tìm kiếm')
    return
  }

  // Only reset pagination for new searches (not when changing pages)
  if (!isPaginationChange.value) {
    resetPagination()
  }

  isSearching.value = true

  const request: QueryLookupRequest = {
    colName: singleLookup.value.searchColumn,
    values: [singleLookup.value.searchValue],
    searchMode: singleLookup.value.searchMode,
    page: currentPage.value,
    limit: pageSize.value
  }

  // Add date filtering if date range is selected
  if (singleLookup.value.dateRange && singleLookup.value.dateRange.length === 2) {
    request.startDate = new Date(singleLookup.value.dateRange[0]).toISOString().split('T')[0]
    request.endDate = new Date(singleLookup.value.dateRange[1]).toISOString().split('T')[0]
  }

  const result = await executeSingleSearch(request)

  isSearching.value = false
  isPaginationChange.value = false // Reset the pagination change flag

  if (result.success && singleSearchData.value) {
    // Debug log to see what API returns
    console.log('Single search API response:', singleSearchData.value)

    // Update pagination state from API response
    totalResults.value = singleSearchData.value.total || 0
    currentPage.value = singleSearchData.value.page || 1
    pageSize.value = singleSearchData.value.limit || pageSize.value

    console.log('Updated pagination state:', {
      totalResults: totalResults.value,
      currentPage: currentPage.value,
      pageSize: pageSize.value
    })

    // Map the API response data to the table format
    searchResults.value = singleSearchData.value.data.map((item: LookupResult, index: number) => {
      // Create a result object with proper structure
      const resultItem: SearchResult = {
        id: item.id || `result-${index}`,
        // Tính điểm khớp thực tế dựa trên từ khóa tìm kiếm và giá trị tìm thấy
        matchScore: calculateMatchScore(
          singleLookup.value.searchValue,
          item[singleLookup.value.searchColumn],
          singleLookup.value.searchMode
        )
      }

      // Add all the dynamic properties from the lookup result
      Object.keys(item).forEach(key => {
        if (key !== 'id') {
          resultItem[key] = item[key]
        }
      })

      return resultItem
    })

    message.success(`Tìm thấy ${singleSearchData.value.total} kết quả cho "${singleLookup.value.searchValue}" (tìm kiếm ${singleLookup.value.searchMode})`)
  } else {
    message.error(`Tìm kiếm thất bại: ${result.error || singleSearchError.value}`)
    searchResults.value = []
    totalResults.value = 0
  }
}

async function performBulkSearch() {
  if (!bulkLookup.value.values.trim()) {
    message.error('Vui lòng nhập các giá trị cần tìm kiếm')
    return
  }

  const values = bulkLookup.value.values
    .split('\n')
    .map(v => v.trim())
    .filter(v => v.length > 0)

  if (values.length === 0) {
    message.error('Vui lòng nhập các giá trị tìm kiếm hợp lệ')
    return
  }

  // Only reset pagination for new searches (not when changing pages)
  if (!isPaginationChange.value) {
    resetPagination()
  }

  isSearching.value = true

  const request: BulkSearchRequest = {
    searchTerms: values,
    colName: bulkLookup.value.searchColumn,
    searchMode: bulkLookup.value.searchMode,
    page: currentPage.value,
    limit: pageSize.value
  }

  // Add date filtering if date range is selected
  if (bulkLookup.value.dateRange && bulkLookup.value.dateRange.length === 2) {
    request.startDate = new Date(bulkLookup.value.dateRange[0]).toISOString().split('T')[0]
    request.endDate = new Date(bulkLookup.value.dateRange[1]).toISOString().split('T')[0]
  }

  const result = await executeBulkSearch(request)

  isSearching.value = false
  isPaginationChange.value = false // Reset the pagination change flag

  if (result.success && bulkSearchData.value) {
    // Debug log to see what API returns
    console.log('Bulk search API response:', bulkSearchData.value)

    // Handle the API response structure directly since it matches PaginatedResponse
    const responseData = bulkSearchData.value.data || []
    const responseTotal = bulkSearchData.value.total || 0

    // Update pagination state from API response
    totalResults.value = responseTotal
    currentPage.value = bulkSearchData.value.page || 1
    pageSize.value = bulkSearchData.value.limit || pageSize.value

    console.log('Updated pagination state:', {
      totalResults: totalResults.value,
      currentPage: currentPage.value,
      pageSize: pageSize.value
    })

    // Map the API response data to the table format
    searchResults.value = responseData.map((item: LookupResult, index: number) => {
      // Tính điểm khớp tốt nhất từ tất cả các từ khóa tìm kiếm
      const bestMatchScore = Math.max(
        ...values.map(searchTerm => {
          const score = calculateMatchScore(
            searchTerm,
            item[bulkLookup.value.searchColumn],
            bulkLookup.value.searchMode
          )
          return parseInt(score.replace('%', ''))
        })
      )

      // Create a result object with proper structure
      const resultItem: SearchResult = {
        id: item.id || `result-${index}`,
        matchScore: `${bestMatchScore}%`
      }

      // Add all the dynamic properties from the lookup result
      Object.keys(item).forEach(key => {
        if (key !== 'id') {
          resultItem[key] = item[key]
        }
      })

      return resultItem
    })

    message.success(`Tìm kiếm hàng loạt hoàn thành: Tìm thấy ${responseTotal} kết quả từ ${values.length} từ khóa (chế độ ${bulkLookup.value.searchMode})`)
  } else {
    message.error(`Tìm kiếm hàng loạt thất bại: ${result.error || bulkSearchError.value}`)
    searchResults.value = []
    totalResults.value = 0
  }
}

// File upload functions
function triggerFileUpload() {
  fileInputRef.value?.click()
}

function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    const values = content.split('\n').map(v => v.trim()).filter(v => v.length > 0)
    bulkLookup.value.values = values.join('\n')
    message.success(`Đã tải ${values.length} giá trị từ file`)
  }
  reader.readAsText(file)
}

function triggerDataUpload() {
  dataUploadInputRef.value?.click()
}

function handleDataUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Show loading message
  message.loading('Uploading file to database...', { duration: 0 })

  uploadApi.uploadDataFile(file)
    .then((response: { success: boolean; rowsCount?: number; jobId?: string; message?: string }) => {
      if (response.success) {
        message.destroyAll()
        message.success(`✅ Tải lên thành công! Đã xử lý ${response.rowsCount} dòng. Mã công việc: ${response.jobId}`)

        // Clear the file input
        if (dataUploadInputRef.value) {
          dataUploadInputRef.value.value = ''
        }
      } else {
        message.destroyAll()
        message.error(`❌ Tải lên thất bại: ${response.message}`)
      }
    })
    .catch((error: { message?: string }) => {
      message.destroyAll()
      message.error(`❌ Lỗi tải lên: ${error.message || 'Lỗi không xác định'}`)
      console.error('Upload error:', error)
    })
}

async function exportResults() {
  if (searchResults.value.length === 0) {
    message.error('Không có kết quả để xuất')
    return
  }

  try {
    message.loading('Đang chuẩn bị file xuất...', { duration: 0 })

    // Xác định loại tìm kiếm và dữ liệu để export
    let exportRequest: ExportSearchResultsRequest

    // Kiểm tra xem đây là kết quả từ single search hay bulk search
    const isBulkSearch = bulkLookup.value.values.trim().length > 0 && searchResults.value.length > 0

    if (isBulkSearch) {
      const searchTerms = bulkLookup.value.values
        .split('\n')
        .map(v => v.trim())
        .filter(v => v.length > 0)

      exportRequest = {
        colName: bulkLookup.value.searchColumn,
        values: searchTerms,
        searchMode: bulkLookup.value.searchMode,
        searchType: 'bulk'
      }
    } else {
      exportRequest = {
        colName: singleLookup.value.searchColumn,
        values: [singleLookup.value.searchValue],
        searchMode: singleLookup.value.searchMode,
        searchType: 'single'
      }
    }

    // Gọi API để export từ server
    const response = await lookupApi.exportSearchResults(exportRequest)

    console.log('Export API response:', response) // Debug log

    message.destroyAll()

    if (response.success && response.data) {
      // Backend trả về { success: true, data: results[], total: number, ... }
      // nhưng apiCall wrap nó thành { data: backendResponse, success: true }
      const backendResponse = response.data
      const results = Array.isArray(backendResponse.data) ? backendResponse.data : []

      if (results.length === 0) {
        message.error('Không có dữ liệu để xuất')
        return
      }

      // Get all unique column names from results
      const allColumns: Record<string, boolean> = {}
      results.forEach((row: LookupResult) => {
        Object.keys(row).forEach(key => {
          if (key !== 'id') {
            allColumns[key] = true
          }
        })
      })

      const headers = Object.keys(allColumns)

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...results.map((row: LookupResult) =>
          headers.map(header => {
            const value = row[header]
            // Handle values that might contain commas
            return typeof value === 'string' && value.indexOf(',') !== -1
              ? `"${value}"`
              : String(value || '')
          }).join(',')
        )
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lookup-results-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      message.success(`Đã xuất ${results.length} kết quả thành công`)
    } else {
      message.error('Có lỗi xảy ra khi xuất file')
    }
  } catch (error: unknown) {
    message.destroyAll()
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định'
    message.error(`Lỗi xuất file: ${errorMessage}`)
    console.error('Export error:', error)
  }
}


</script>
