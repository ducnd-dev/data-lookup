<template>
  <PageWrapper>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="text-3xl font-bold text-gray-900">Upload</h1>
          <p class="mt-2 text-sm text-gray-700">Upload and manage your files</p>
        </div>
        <div class="flex gap-3 flex-shrink-0">
          <n-button type="default" size="large" @click="downloadExampleFile">
            <template #icon>
              <n-icon>
                <Download />
              </n-icon>
            </template>
            Download Example
          </n-button>
          <n-button type="primary" size="large" @click="showBulkUpload = true">
            <template #icon>
              <n-icon>
                <FolderOpen />
              </n-icon>
            </template>
            Bulk Upload
          </n-button>
        </div>
      </div>

      <!-- Upload Area -->
      <n-card>
        <div class="text-center py-12">
          <n-upload ref="uploadRef" multiple directory-dnd :max="20" :on-before-upload="beforeUpload"
            :on-finish="onUploadFinish" :on-remove="onRemove"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv">
            <n-upload-dragger>
              <div class="text-center">
                <n-icon size="72" class="mb-4">
                  <CloudUpload />
                </n-icon>
                <h3 class="text-xl font-semibold mb-2">Drop files here or click to browse</h3>
                <p class="mb-4">
                  Supports: Images, PDFs, Documents, Spreadsheets (CSV, Excel)
                </p>
                <p class="text-sm">
                  Maximum file size: 10MB per file, up to 20 files
                </p>
              </div>
            </n-upload-dragger>
          </n-upload>
        </div>
      </n-card>

      <!-- Upload Progress -->
      <n-card v-if="uploadProgress.length > 0" title="Upload Progress">
        <div class="space-y-4">
          <div v-for="file in uploadProgress" :key="file.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <n-icon size="24" :class="getFileIconClass(file.type)">
                <Document />
              </n-icon>
              <div>
                <p class="font-medium">{{ file.name }}</p>
                <p class="text-sm text-gray-500">{{ formatFileSize(file.size) }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <n-progress type="line" :percentage="file.progress"
                :status="file.status === 'error' ? 'error' : file.status === 'success' ? 'success' : 'info'"
                style="width: 120px" />
              <n-button v-if="file.status === 'error'" size="small" type="error" @click="retryUpload(file)">
                Retry
              </n-button>
              <n-button size="small" type="error" ghost @click="removeFile(file.id)">
                Remove
              </n-button>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Recent Uploads -->
      <n-card title="Recent Uploads">
        <n-data-table :columns="uploadColumns" :data="recentUploads" :pagination="{ pageSize: 10 }" />
      </n-card>

      <!-- Upload Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <n-card>
          <n-statistic label="Total Files" :value="uploadStats.totalFiles">
            <template #prefix>
              <n-icon class="text-blue-500">
                <Documents />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>

        <n-card>
          <n-statistic label="Storage Used" :value="uploadStats.storageUsed" suffix="MB">
            <template #prefix>
              <n-icon class="text-green-500">
                <Server />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>

        <n-card>
          <n-statistic label="Success Rate" :value="uploadStats.successRate" suffix="%">
            <template #prefix>
              <n-icon class="text-purple-500">
                <TrendingUp />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-blue-500 mb-4">
              <Image />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">Images</h3>
            <p class="text-gray-600 text-sm mb-4">
              Upload and manage image files
            </p>
            <n-button type="primary" size="small" @click="filterByType('image')">
              View Images
            </n-button>
          </div>
        </n-card>

        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-red-500 mb-4">
              <DocumentText />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">Documents</h3>
            <p class="text-gray-600 text-sm mb-4">
              Upload PDFs and documents
            </p>
            <n-button type="primary" size="small" @click="filterByType('document')">
              View Documents
            </n-button>
          </div>
        </n-card>

        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-green-500 mb-4">
              <Grid />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">Spreadsheets</h3>
            <p class="text-gray-600 text-sm mb-4">
              Upload Excel and CSV files
            </p>
            <n-button type="primary" size="small" @click="filterByType('spreadsheet')">
              View Spreadsheets
            </n-button>
          </div>
        </n-card>

        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-purple-500 mb-4">
              <Archive />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">Archives</h3>
            <p class="text-gray-600 text-sm mb-4">
              Upload ZIP and compressed files
            </p>
            <n-button type="primary" size="small" @click="filterByType('archive')">
              View Archives
            </n-button>
          </div>
        </n-card>
      </div>

      <!-- Bulk Upload Modal -->
      <n-modal v-model:show="showBulkUpload">
        <n-card style="width: 800px" title="Bulk Upload" :bordered="false" size="huge" role="dialog" aria-modal="true">
          <template #header-extra>
            <n-button quaternary circle @click="showBulkUpload = false">
              <template #icon>
                <n-icon>
                  <CloseOutline />
                </n-icon>
              </template>
            </n-button>
          </template>

          <div class="space-y-6">
            <!-- Upload Instructions -->
            <n-alert type="info" :show-icon="false">
              <div class="space-y-2">
                <h4 class="font-semibold">Bulk Upload Instructions:</h4>
                <ul class="list-disc list-inside space-y-1 text-sm">
                  <li>Select multiple files or drag entire folders</li>
                  <li>Supported formats: CSV, Excel (.xlsx), Text files</li>
                  <li>Each file should contain data with columns: col_a, col_b, col_c</li>
                  <li>Maximum file size: 50MB per file</li>
                  <li>Maximum 100 files per bulk upload</li>
                </ul>
              </div>
            </n-alert>

            <!-- Example File Download -->
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 class="font-medium">Need a template?</h4>
                <p class="text-sm text-gray-600">Download our example file to see the expected format</p>
              </div>
              <n-button type="primary" @click="downloadExampleFile">
                <template #icon>
                  <n-icon>
                    <Download />
                  </n-icon>
                </template>
                Download Example CSV
              </n-button>
            </div>

            <!-- Bulk Upload Area -->
            <n-upload
              ref="bulkUploadRef"
              multiple
              directory-dnd
              :max="100"
              :on-before-upload="beforeBulkUpload"
              :on-finish="onBulkUploadFinish"
              accept=".csv,.xlsx,.xls,.txt"
            >
              <n-upload-dragger>
                <div class="text-center py-8">
                  <n-icon size="64" class="mb-4 text-blue-500">
                    <FolderOpen />
                  </n-icon>
                  <h3 class="text-lg font-semibold mb-2">Drop multiple files or folders here</h3>
                  <p class="text-gray-600 mb-2">or click to select files</p>
                  <n-tag type="info" size="small">Bulk upload up to 100 files at once</n-tag>
                </div>
              </n-upload-dragger>
            </n-upload>

            <!-- Bulk Upload Progress -->
            <div v-if="bulkUploadProgress.length > 0" class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="font-semibold">Upload Progress ({{ completedUploads }}/{{ bulkUploadProgress.length }})</h4>
                <n-progress
                  type="line"
                  :percentage="Math.round((completedUploads / bulkUploadProgress.length) * 100)"
                  status="success"
                  style="width: 200px"
                />
              </div>

              <div class="max-h-60 overflow-y-auto space-y-2">
                <div
                  v-for="file in bulkUploadProgress"
                  :key="file.id"
                  class="flex items-center justify-between p-2 bg-white border rounded"
                >
                  <div class="flex items-center space-x-2 flex-1">
                    <n-icon :class="getStatusIconClass(file.status)">
                      <Document />
                    </n-icon>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate">{{ file.name }}</p>
                      <p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <n-progress
                      type="line"
                      :percentage="file.progress"
                      :status="file.status === 'error' ? 'error' : file.status === 'success' ? 'success' : 'info'"
                      style="width: 100px"
                      size="small"
                    />
                    <n-tag
                      :type="file.status === 'success' ? 'success' : file.status === 'error' ? 'error' : 'info'"
                      size="small"
                    >
                      {{ file.status }}
                    </n-tag>
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-center pt-4 border-t">
                <div class="text-sm text-gray-600">
                  <span class="text-green-600">{{ successCount }} successful</span>
                  <span v-if="errorCount > 0" class="text-red-600 ml-4">{{ errorCount }} failed</span>
                </div>
                <div class="flex gap-2">
                  <n-button @click="clearBulkProgress">Clear</n-button>
                  <n-button type="primary" @click="showBulkUpload = false">Done</n-button>
                </div>
              </div>
            </div>
          </div>
        </n-card>
      </n-modal>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import {
  Archive,
  CloudUpload,
  CloseOutline,
  Document, Documents,
  DocumentText,
  Download,
  Eye,
  FolderOpen,
  Grid,
  Image,
  Server,
  Trash,
  TrendingUp
} from '@vicons/ionicons5'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NIcon,
  NModal,
  NProgress,
  NStatistic,
  NTag,
  NUpload, NUploadDragger,
  useMessage, type DataTableColumns, type UploadFileInfo
} from 'naive-ui'
import { computed, h, ref } from 'vue'
import PageWrapper from '../components/common/PageWrapper.vue'
import uploadApi from '../services/uploadApi'

interface UploadFile {
  id: string
  name: string
  size: number
  type: string
  progress: number
  status: 'uploading' | 'success' | 'error'
}

interface RecentUpload {
  id: number
  name: string
  size: number
  type: string
  uploadedAt: string
  status: string
}

const message = useMessage()

// State
const uploadRef = ref()
const bulkUploadRef = ref()
const showBulkUpload = ref(false)
const uploadProgress = ref<UploadFile[]>([])
const bulkUploadProgress = ref<UploadFile[]>([])
const recentUploads = ref<RecentUpload[]>([])

// Statistics
const uploadStats = computed(() => ({
  totalFiles: recentUploads.value.length,
  storageUsed: Math.round(recentUploads.value.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)),
  successRate: 98.5
}))

// Bulk upload statistics
const completedUploads = computed(() =>
  bulkUploadProgress.value.filter(f => f.status === 'success' || f.status === 'error').length
)

const successCount = computed(() =>
  bulkUploadProgress.value.filter(f => f.status === 'success').length
)

const errorCount = computed(() =>
  bulkUploadProgress.value.filter(f => f.status === 'error').length
)

// Table columns
const uploadColumns: DataTableColumns<RecentUpload> = [
  {
    title: 'Name',
    key: 'name',
    render: (row) => {
      return h('div', { class: 'flex items-center space-x-2' }, [
        h(NIcon, { class: getFileIconClass(row.type) }, { default: () => h(Document) }),
        h('span', row.name)
      ])
    }
  },
  {
    title: 'Type',
    key: 'type'
  },
  {
    title: 'Size',
    key: 'size',
    render: (row) => formatFileSize(row.size)
  },
  {
    title: 'Uploaded At',
    key: 'uploadedAt'
  },
  {
    title: 'Status',
    key: 'status',
    render: (row) => h('span', {
      class: row.status === 'Success' ? 'text-green-600' : 'text-red-600'
    }, row.status)
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (row) => h('div', { class: 'flex space-x-2' }, [
      h(NButton, {
        size: 'small',
        type: 'primary',
        onClick: () => downloadFile(row)
      }, {
        default: () => 'Download',
        icon: () => h(NIcon, null, { default: () => h(Download) })
      }),
      h(NButton, {
        size: 'small',
        type: 'error',
        onClick: () => deleteFile(row)
      }, {
        default: () => 'Delete',
        icon: () => h(NIcon, null, { default: () => h(Trash) })
      })
    ])
  }
]

// Methods
function beforeUpload(options: { file: UploadFileInfo, fileList: UploadFileInfo[] }) {
  const file = options.file

  // Check file size (10MB limit)
  if (file.file && file.file.size > 10 * 1024 * 1024) {
    message.error('File size must be less than 10MB')
    return false
  }

  // Add to progress tracking
  const uploadFile: UploadFile = {
    id: Date.now().toString(),
    name: file.name,
    size: file.file?.size || 0,
    type: file.file?.type || '',
    progress: 0,
    status: 'uploading'
  }

  uploadProgress.value.push(uploadFile)

  // Real API upload instead of simulation
  if (file.file) {
    uploadApi.uploadDataFile(file.file)
      .then((response: any) => {
        const fileIndex = uploadProgress.value.findIndex(f => f.id === uploadFile.id)
        if (fileIndex !== -1 && uploadProgress.value[fileIndex]) {
          if (response.success) {
            uploadProgress.value[fileIndex]!.progress = 100
            uploadProgress.value[fileIndex]!.status = 'success'
            message.success(`✅ ${file.name} uploaded successfully! ${response.rowsCount} rows processed.`)
          } else {
            uploadProgress.value[fileIndex]!.status = 'error'
            message.error(`❌ Upload failed: ${response.message}`)
          }
        }
      })
      .catch((error: any) => {
        const fileIndex = uploadProgress.value.findIndex(f => f.id === uploadFile.id)
        if (fileIndex !== -1 && uploadProgress.value[fileIndex]) {
          uploadProgress.value[fileIndex]!.status = 'error'
          message.error(`❌ Upload error: ${error.message || 'Unknown error'}`)
        }
      })
  }

  return false // Prevent naive-ui's default upload behavior
}

function onUploadFinish(options: { file: UploadFileInfo, event?: ProgressEvent }) {
  message.success(`${options.file.name} uploaded successfully`)

  // Add to recent uploads
  const newUpload: RecentUpload = {
    id: Date.now(),
    name: options.file.name,
    size: options.file.file?.size || 0,
    type: getFileType(options.file.name),
    uploadedAt: new Date().toLocaleString(),
    status: 'Success'
  }
  recentUploads.value.unshift(newUpload)
}

function onRemove(options: { file: UploadFileInfo, fileList: UploadFileInfo[] }) {
  const fileName = options.file.name
  uploadProgress.value = uploadProgress.value.filter(f => f.name !== fileName)
  message.info(`${fileName} removed`)
}

function removeFile(id: string) {
  uploadProgress.value = uploadProgress.value.filter(f => f.id !== id)
}

function retryUpload(file: UploadFile) {
  file.status = 'uploading'
  file.progress = 0
  message.info(`Retrying upload for ${file.name}`)
}

function getFileIconClass(type: string): string {
  const typeMap: Record<string, string> = {
    'Image': 'text-blue-500',
    'PDF': 'text-red-500',
    'Spreadsheet': 'text-green-500',
    'Document': 'text-purple-500',
    'Archive': 'text-orange-500'
  }
  return typeMap[type] || 'text-gray-500'
}

function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const typeMap: Record<string, string> = {
    'jpg': 'Image', 'jpeg': 'Image', 'png': 'Image', 'gif': 'Image',
    'pdf': 'PDF',
    'doc': 'Document', 'docx': 'Document',
    'xls': 'Spreadsheet', 'xlsx': 'Spreadsheet', 'csv': 'Spreadsheet',
    'zip': 'Archive', 'rar': 'Archive', '7z': 'Archive'
  }
  return typeMap[ext || ''] || 'Unknown'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function filterByType(type: string) {
  message.info(`Filtering by ${type} files`)
}

function viewFile(file: RecentUpload) {
  message.info(`Viewing ${file.name}`)
}

function downloadFile(file: RecentUpload) {
  message.success(`Downloading ${file.name}`)
}

function deleteFile(file: RecentUpload) {
  const index = recentUploads.value.findIndex(f => f.id === file.id)
  if (index !== -1) {
    recentUploads.value.splice(index, 1)
    message.success(`${file.name} deleted successfully`)
  }
}

// Download example file function
function downloadExampleFile() {
  const exampleData = [
    { uid: 'USR001', phone: '+1234567890', address: '123 Main St, New York, NY 10001' },
    { uid: 'USR002', phone: '+1234567891', address: '456 Oak Ave, Los Angeles, CA 90210' },
    { uid: 'USR003', phone: '+1234567892', address: '789 Pine Rd, Chicago, IL 60601' },
    { uid: 'USR004', phone: '+1234567893', address: '321 Elm St, Houston, TX 77001' },
    { uid: 'USR005', phone: '+1234567894', address: '654 Maple Dr, Phoenix, AZ 85001' }
  ]

  // Convert to CSV
  const headers = Object.keys(exampleData[0])
  const csvContent = [
    headers.join(','),
    ...exampleData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
  ].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'data_upload_example.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  message.success('Example file downloaded successfully')
}

// Bulk upload functions
function beforeBulkUpload(options: { file: UploadFileInfo, fileList: UploadFileInfo[] }) {
  const file = options.file

  // Check file size (50MB limit for bulk upload)
  if (file.file && file.file.size > 50 * 1024 * 1024) {
    message.error('File size must be less than 50MB for bulk upload')
    return false
  }

  // Check file type
  const allowedTypes = ['.csv', '.xlsx', '.xls', '.txt']
  const fileName = file.name.toLowerCase()
  const isValidType = allowedTypes.some(type => fileName.endsWith(type))

  if (!isValidType) {
    message.error('Only CSV, Excel (.xlsx, .xls), and Text files are allowed for bulk upload')
    return false
  }

  // Add to bulk progress tracking
  const uploadFile: UploadFile = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: file.name,
    size: file.file?.size || 0,
    type: file.file?.type || '',
    progress: 0,
    status: 'uploading'
  }

  bulkUploadProgress.value.push(uploadFile)

  // Upload using API
  if (file.file) {
    uploadApi.uploadDataFile(file.file)
      .then((response: any) => {
        const fileIndex = bulkUploadProgress.value.findIndex(f => f.id === uploadFile.id)
        if (fileIndex !== -1 && bulkUploadProgress.value[fileIndex]) {
          if (response.success) {
            bulkUploadProgress.value[fileIndex]!.progress = 100
            bulkUploadProgress.value[fileIndex]!.status = 'success'
          } else {
            bulkUploadProgress.value[fileIndex]!.status = 'error'
          }
        }
      })
      .catch((error: any) => {
        const fileIndex = bulkUploadProgress.value.findIndex(f => f.id === uploadFile.id)
        if (fileIndex !== -1 && bulkUploadProgress.value[fileIndex]) {
          bulkUploadProgress.value[fileIndex]!.status = 'error'
        }
      })
  }

  return false // Prevent naive-ui's default upload behavior
}

function onBulkUploadFinish(options: { file: UploadFileInfo, event?: ProgressEvent }) {
  // Add to recent uploads if successful
  const newUpload: RecentUpload = {
    id: Date.now(),
    name: options.file.name,
    size: options.file.file?.size || 0,
    type: getFileType(options.file.name),
    uploadedAt: new Date().toLocaleString(),
    status: 'Success'
  }
  recentUploads.value.unshift(newUpload)
}

function clearBulkProgress() {
  bulkUploadProgress.value = []
  message.info('Bulk upload progress cleared')
}

function getStatusIconClass(status: string): string {
  const statusMap: Record<string, string> = {
    'uploading': 'text-blue-500',
    'success': 'text-green-500',
    'error': 'text-red-500'
  }
  return statusMap[status] || 'text-gray-500'
}
</script>
