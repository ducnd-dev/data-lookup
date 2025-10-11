<template>
  <PageWrapper>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="text-3xl font-bold text-gray-900">Upload</h1>
          <p class="mt-2 text-sm text-gray-700">Upload files and manage your data</p>
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

      <!-- Recent Uploads & Jobs -->
      <n-card>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Recent Uploads & Jobs</h3>
            <div class="flex gap-2">
              <n-button size="small" @click="refreshData">
                <template #icon>
                  <n-icon>
                    <Refresh />
                  </n-icon>
                </template>
                Refresh
              </n-button>
              <n-select v-model:value="viewFilter" placeholder="Filter" style="width: 120px" size="small">
                <n-option value="all" label="All" />
                <n-option value="uploads" label="Uploads" />
                <n-option value="jobs" label="Jobs" />
              </n-select>
            </div>
          </div>
        </template>

        <n-data-table
          :columns="combinedColumns"
          :data="filteredCombinedData"
          :pagination="paginationConfig"
          :loading="loading || jobsLoading"
          :scroll-x="1200"
          striped
        />
      </n-card>


      <!-- Job Details Modal -->
      <n-modal v-model:show="showJobDetailsModal" preset="card" style="width: 800px" title="Job Details">
        <div v-if="selectedJob && selectedJob.type === 'job'" class="space-y-6">
          <!-- Basic Information -->
          <n-card title="Basic Information" size="small">
            <n-descriptions :column="2" bordered>
              <n-descriptions-item label="Job Name">{{ selectedJob.displayName }}</n-descriptions-item>
              <n-descriptions-item label="Job Type">
                <n-tag type="info">{{ selectedJob.originalType || selectedJob.type }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="Status">
                <n-tag :type="getStatusType(selectedJob.status)">{{ selectedJob.status }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="Progress">
                <div v-if="selectedJob.progress !== undefined" class="flex items-center space-x-2">
                  <n-progress type="line" :percentage="selectedJob.progress" style="width: 100px" />
                  <span>{{ selectedJob.progress }}%</span>
                </div>
                <span v-else>-</span>
              </n-descriptions-item>
              <n-descriptions-item label="Created By">{{ selectedJob.createdBy || '-' }}</n-descriptions-item>
              <n-descriptions-item label="Description">{{ selectedJob.description || '-' }}</n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- Time Information -->
          <n-card title="Time Information" size="small">
            <n-descriptions :column="1" bordered>
              <n-descriptions-item label="Created At">{{ formatDateTime(selectedJob.createdAt) }}</n-descriptions-item>
              <n-descriptions-item label="Started At">{{ selectedJob.startTime ? formatDateTime(selectedJob.startTime) : '-' }}</n-descriptions-item>
              <n-descriptions-item label="Ended At">{{ selectedJob.endTime ? formatDateTime(selectedJob.endTime) : '-' }}</n-descriptions-item>
              <n-descriptions-item label="Duration" v-if="selectedJob.startTime && selectedJob.endTime">
                {{ calculateDuration(selectedJob.startTime, selectedJob.endTime) }}
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- Results -->
          <n-card v-if="selectedJob.result" title="Results" size="small">
            <n-descriptions :column="2" bordered>
              <!-- Import Results (Created/Updated) -->
              <n-descriptions-item label="Records Created" v-if="(selectedJob.result as any)?.createdCount !== undefined">
                <span class="text-blue-600 font-medium">{{ (selectedJob.result as any)?.createdCount || 0 }}</span>
              </n-descriptions-item>
              <n-descriptions-item label="Records Updated" v-if="(selectedJob.result as any)?.updatedCount !== undefined">
                <span class="text-purple-600 font-medium">{{ (selectedJob.result as any)?.updatedCount || 0 }}</span>
              </n-descriptions-item>

              <!-- General Job Results -->
              <n-descriptions-item label="Records Processed" v-if="selectedJob.result">{{ selectedJob.result.recordsProcessed || 0 }}</n-descriptions-item>
              <n-descriptions-item label="Successful Records" v-if="selectedJob.result">
                <span class="text-green-600 font-medium">{{ selectedJob.result.recordsSuccessful || 0 }}</span>
              </n-descriptions-item>
              <n-descriptions-item label="Failed Records" v-if="selectedJob.result">
                <span class="text-red-500 font-medium">{{ selectedJob.result.recordsFailed || 0 }}</span>
              </n-descriptions-item>
              <n-descriptions-item label="Success Rate" v-if="selectedJob.result">
                {{ selectedJob.result.recordsProcessed ? Math.round((selectedJob.result.recordsSuccessful || 0) / selectedJob.result.recordsProcessed * 100) : 0 }}%
              </n-descriptions-item>
              <n-descriptions-item label="Output File" v-if="selectedJob.result?.outputFile">
                <n-button size="small" type="primary" @click="downloadOutputFile(selectedJob.result.outputFile)">
                  Download Output
                </n-button>
              </n-descriptions-item>
              <n-descriptions-item label="Original File" v-if="selectedJob.metadata?.originalFileName && 'id' in selectedJob">
                <n-button size="small" type="info" @click="downloadOriginalFile(String(selectedJob.id), selectedJob.metadata?.originalFileName)">
                  Download Original
                </n-button>
              </n-descriptions-item>
            </n-descriptions>

            <!-- Error Message -->
            <div v-if="selectedJob.result?.errorMessage" class="mt-4">
              <h4 class="text-sm font-medium text-red-600 mb-2">Error Message:</h4>
              <div class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {{ selectedJob.result.errorMessage }}
              </div>
            </div>
          </n-card>

          <!-- Metadata -->
          <n-card v-if="selectedJob.metadata" title="Metadata" size="small">
            <n-descriptions :column="2" bordered>
              <n-descriptions-item label="File Name" v-if="selectedJob.metadata.fileName">{{ selectedJob.metadata.originalFileName }}</n-descriptions-item>
              <n-descriptions-item label="Total Rows" v-if="selectedJob.metadata.totalRows">{{ selectedJob.metadata.totalRows }}</n-descriptions-item>
              <n-descriptions-item label="File Path" v-if="selectedJob.metadata.filePath">
                <span class="text-xs font-mono text-gray-600">{{ selectedJob.metadata.filePath }}</span>
              </n-descriptions-item>
            </n-descriptions>
          </n-card>
        </div>

        <template #action>
          <div class="flex justify-end">
            <n-button @click="showJobDetailsModal = false">Close</n-button>
          </div>
        </template>
      </n-modal>

      <!-- Bulk Upload Modal -->
      <!-- Removed -->

      <!-- Create Job Modal -->
      <!-- Removed -->
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import {
  CloudUpload,
  Document,
  Download,
  Refresh
} from '@vicons/ionicons5'
import {
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NIcon,
  NModal,
  NProgress,
  NSelect,
  NTag,
  NUpload, NUploadDragger,
  useMessage, type DataTableColumns, type UploadFileInfo
} from 'naive-ui'
import { computed, h, ref, onMounted, watch } from 'vue'
import PageWrapper from '../components/common/PageWrapper.vue'
import uploadApi from '../services/uploadApi'
import { jobApi } from '@/services/jobApi'

interface JobItem {
  id: string
  name: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  description?: string
  progress: number
  startTime?: string
  endTime?: string
  createdBy: string
  result?: {
    recordsProcessed: number
    recordsSuccessful: number
    recordsFailed: number
    outputFile?: string | null
    errorMessage?: string | null
    createdCount?: number
    updatedCount?: number
  }
  metadata?: {
    fileName?: string
    originalFileName?: string
    totalRows?: number
    filePath?: string
  }
  createdAt: string
  updatedAt: string
}

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

// Filter for combined view
const viewFilter = ref('all')

// Pagination state
const currentPage = ref(1)
const pageSize = ref(15)

// Job Management API composables (with dynamic pagination)
const jobsData = ref<{
  jobs: JobItem[]
  total: number
  page: number
  limit: number
  totalPages: number
} | null>(null)
const jobsLoading = ref(false)

const fetchJobs = async () => {
  try {
    jobsLoading.value = true
    const response = await jobApi.getJobs({
      page: currentPage.value,
      limit: pageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })

    if (response.success) {
      jobsData.value = response.data
    } else {
      console.error('Failed to fetch jobs:', response.error)
      jobsData.value = { jobs: [], total: 0, page: 1, limit: pageSize.value, totalPages: 0 }
    }
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    jobsData.value = { jobs: [], total: 0, page: 1, limit: pageSize.value, totalPages: 0 }
  } finally {
    jobsLoading.value = false
  }
}

// State
const uploadRef = ref()
const loading = ref(false)
const uploadProgress = ref<UploadFile[]>([])
const recentUploads = ref<RecentUpload[]>([])

// Job Details Modal State
const showJobDetailsModal = ref(false)
const selectedJob = ref<{
  type: 'upload' | 'job',
  displayName: string,
  status: string,
  size?: number,
  createdAt: string,
  progress?: number,
  originalType?: string,
  description?: string,
  startTime?: string,
  endTime?: string,
  createdBy?: string,
  createdCount?: number,
  updatedCount?: number,
  metadata?: {
    fileName?: string
    totalRows?: number
    filePath?: string
    originalFileName?: string
  },
  result?: {
    recordsProcessed: number
    recordsSuccessful: number
    recordsFailed: number
    outputFile?: string | null
    errorMessage?: string | null
  }
} | null>(null)

// Job Management State - removed bulk upload and create job

// Computed data with fallback
const jobs = computed(() => {
  const jobsList = jobsData.value?.jobs || []
  console.log('Jobs data:', jobsList)
  return jobsList
})

// Combined data for unified table
const combinedData = computed(() => {
  const uploads = recentUploads.value.map(upload => ({
    ...upload,
    type: 'upload' as const,
    displayName: upload.name,
    createdAt: upload.uploadedAt,
    status: 'completed' as const
  }))

  const jobItems = jobs.value.map((job: JobItem) => ({
    ...job,
    type: 'job' as const,
    displayName: job.name,
    createdAt: job.createdAt,
    status: job.status,
    progress: job.progress,
    result: job.result,
    originalType: job.type, // Keep original job type for display
    description: job.description,
    startTime: job.startTime,
    endTime: job.endTime,
    createdBy: job.createdBy,
    metadata: job.metadata
  }))

  return [...uploads, ...jobItems].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const filteredCombinedData = computed(() => {
  // For server-side pagination, return the jobs from current page directly
  // Don't apply additional filtering here since backend handles pagination
  if (viewFilter.value === 'jobs') {
    return jobs.value.map((job: JobItem) => ({
      ...job,
      type: 'job' as const,
      displayName: job.name,
      createdAt: job.createdAt,
      status: job.status,
      progress: job.progress,
      result: job.result,
      originalType: job.type,
      description: job.description,
      startTime: job.startTime,
      endTime: job.endTime,
      createdBy: job.createdBy,
      metadata: job.metadata
    }))
  }

  // For uploads and "all" view, use the combined data (client-side)
  if (viewFilter.value === 'uploads') return combinedData.value.filter(item => item.type === 'upload')
  if (viewFilter.value === 'all') return combinedData.value

  return combinedData.value
})

// Pagination computed values
const totalItems = computed(() => {
  // For jobs, use API pagination data if available
  const jobsTotal = jobsData.value?.total || 0
  const uploadsTotal = recentUploads.value.length

  if (viewFilter.value === 'jobs') return jobsTotal
  if (viewFilter.value === 'uploads') return uploadsTotal
  return jobsTotal + uploadsTotal
})

// Pagination config
const paginationConfig = computed(() => {
  // For jobs view, use server-side pagination
  if (viewFilter.value === 'jobs') {
    return {
      page: currentPage.value,
      pageSize: pageSize.value,
      showSizePicker: true,
      pageSizes: [10, 15, 20, 50],
      onChange: handlePageChange,
      onUpdatePageSize: handlePageSizeChange,
      itemCount: totalItems.value,
      showQuickJumper: true
    }
  }

  // For uploads view, use simple client-side pagination
  if (viewFilter.value === 'uploads') {
    return {
      page: 1,
      pageSize: 20,
      showSizePicker: true,
      pageSizes: [10, 20, 50],
      showQuickJumper: false,
      itemCount: totalItems.value
    }
  }

  // For 'all' view, use client-side pagination with larger page size
  return {
    page: 1,
    pageSize: 25,
    showSizePicker: true,
    pageSizes: [25, 50, 100],
    showQuickJumper: true,
    itemCount: totalItems.value
  }
})

// Pagination handlers
function handlePageChange(page: number) {
  currentPage.value = page
  // Only fetch jobs if we're viewing jobs
  if (viewFilter.value === 'jobs' || viewFilter.value === 'all') {
    fetchJobs()
  }
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1 // Reset to first page
  // Only fetch jobs if we're viewing jobs
  if (viewFilter.value === 'jobs' || viewFilter.value === 'all') {
    fetchJobs()
  }
}

// Combined columns for unified table
// Define job type interface
interface CombinedJobItem {
  id: string
  type: 'upload' | 'job'
  displayName: string
  status: string
  size?: number
  createdAt: string
  progress?: number
  originalType?: string
  description?: string
  startTime?: string
  endTime?: string
  createdBy?: string
  fileName?: string
  metadata?: {
    fileName?: string
    originalFileName?: string
    totalRows?: number
  }
  result?: {
    recordsProcessed: number
    recordsSuccessful: number
    recordsFailed: number
    outputFile?: string | null
    errorMessage?: string | null
    createdCount?: number
    updatedCount?: number
  }
}

const combinedColumns: DataTableColumns<CombinedJobItem> = [
  {
    title: 'Type',
    key: 'type',
    width: 100,
    render: (row: CombinedJobItem) => {
      if (row.type === 'upload') {
        return h(NTag, { type: 'info', size: 'small' }, { default: () => 'Upload' })
      }
      // For jobs, show the actual job type
      const jobTypeMap = {
        daily_backup: 'Backup',
        processing: 'Processing',
        export: 'Export',
        import: 'Import',
        search: 'Search',
        sync: 'Sync',
        analysis: 'Analysis'
      } as const

      const jobType = jobTypeMap[row.originalType as keyof typeof jobTypeMap] || row.originalType || 'Job'
      return h(NTag, { type: 'warning', size: 'small' }, { default: () => jobType })
    }
  },
  {
    title: 'Name',
    key: 'displayName',
    ellipsis: { tooltip: true },
    render: (row: CombinedJobItem) => {
      return h('div', [
        h('div', { class: 'font-medium' }, row.displayName),
        row.description && h('div', { class: 'text-xs text-gray-500' }, row.description)
      ])
    }
  },
  {
    title: 'Status',
    key: 'status',
    width: 120,
    render: (row: CombinedJobItem) => {
      const statusConfig = {
        completed: { type: 'success', text: 'Completed' },
        pending: { type: 'warning', text: 'Pending' },
        running: { type: 'info', text: 'Running' },
        failed: { type: 'error', text: 'Failed' },
        cancelled: { type: 'default', text: 'Cancelled' }
      } as const

      const config = statusConfig[row.status as keyof typeof statusConfig] || { type: 'default', text: row.status }
      return h(NTag, { type: config.type, size: 'small' }, { default: () => config.text })
    }
  },
  {
    title: 'Progress',
    key: 'progress',
    width: 120,
    render: (row: CombinedJobItem) => {
      if (row.type === 'job' && typeof row.progress === 'number') {
        return h('div', [
          h(NProgress, {
            type: 'line',
            percentage: row.progress,
            status: row.status === 'failed' ? 'error' : row.status === 'completed' ? 'success' : 'info'
          }),
          h('div', { class: 'text-xs text-center mt-1' }, `${row.progress}%`)
        ])
      }
      return '-'
    }
  },
  {
    title: 'Records/Size',
    key: 'records',
    width: 240,
    render: (row: CombinedJobItem) => {
      if (row.type === 'job') {
        const elements = []

        // Show created/updated counts if available (for import jobs)
        if (row.result?.createdCount !== undefined || row.result?.updatedCount !== undefined) {
          elements.push(
            h('div', { class: 'text-blue-600' }, `➕ Created: ${row.result?.createdCount || 0}`),
            h('div', { class: 'text-purple-600' }, `🔄 Updated: ${row.result?.updatedCount || 0}`)
          )
        }

        // Show success/failed counts if available (for other jobs)
        if (row.result) {
          elements.push(
            // fail count
            h('div', { class: 'text-red-500' }, `❌ Failed: ${row.result.recordsFailed || 0}`),
            h('div', { class: 'text-gray-500' }, `Total: ${row.result.recordsProcessed || 0}`)
          )
        }

        // Add error message if exists
        if (row.result?.errorMessage) {
          elements.push(h('div', {
            class: 'text-red-600 text-xs mt-1 font-medium',
            title: row.result.errorMessage
          }, `Error: ${row.result.errorMessage.substring(0, 30)}${row.result.errorMessage.length > 30 ? '...' : ''}`))
        }

        return h('div', { class: 'text-sm space-y-1' }, elements)
      }
      if (row.type === 'upload' && row.size) {
        return formatFileSize(row.size)
      }
      return '-'
    }
  },
  {
    title: 'Time Info',
    key: 'timeInfo',
    width: 160,
    render: (row: CombinedJobItem) => {
      if (row.type === 'job') {
        return h('div', { class: 'text-xs space-y-1' }, [
          h('div', `Created: ${new Date(row.createdAt).toLocaleString()}`),
          row.startTime && h('div', `Started: ${new Date(row.startTime).toLocaleString()}`),
          row.endTime && h('div', `Ended: ${new Date(row.endTime).toLocaleString()}`)
        ])
      }
      return h('div', { class: 'text-xs' }, new Date(row.createdAt).toLocaleString())
    }
  },
  {
    title: 'Created By',
    key: 'createdBy',
    width: 100,
    render: (row: CombinedJobItem) => {
      if (row.type === 'job' && row.createdBy) {
        return h('div', { class: 'text-sm' }, `User ${row.createdBy}`)
      }
      return '-'
    }
  },
  {
    title: 'Metadata',
    key: 'metadata',
    width: 120,
    render: (row: CombinedJobItem) => {
      if (row.type === 'job' && row.metadata) {
        return h('div', { class: 'text-xs space-y-1' }, [
          row.metadata.fileName && h('div', `File: ${row.metadata.fileName}`),
          row.metadata.totalRows && h('div', `Rows: ${row.metadata.totalRows}`)
        ])
      }
      return '-'
    }
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 220,
    fixed: 'right',
    render: (row: CombinedJobItem) => {
      if (row.type === 'upload') {
        return h('div', { class: 'flex gap-1' }, [
          h(NButton, {
            size: 'small',
            type: 'primary',
            ghost: true,
            onClick: () => message.info(`Download: ${row.displayName}`)
          }, { default: () => 'Download' })
        ])
      } else {
        const buttons = [
          h(NButton, {
            size: 'small',
            type: 'primary',
            ghost: true,
            onClick: () => showJobDetails(row),
            title: 'View job details'
          }, {
            default: () => '👁️ View',
            icon: () => h('span', '📋')
          })
        ]

        // Add download original file button if job has originalFileName (real uploaded file)
        if (row.metadata?.originalFileName && 'id' in row) {
          buttons.push(
            h(NButton, {
              size: 'small',
              type: 'info',
              ghost: true,
              onClick: () => downloadOriginalFile(String(row.id), row.metadata?.originalFileName),
              title: `Download original file: ${row.metadata?.originalFileName}`
            }, {
              default: () => '📥 Original',
              icon: () => h('span', '📁')
            })
          )
        }

        // Note: Download output/result file is not supported yet by backend
        // Backend only supports downloading original uploaded files
        // Uncomment when backend adds download-result endpoint
        /*
        if (row.result?.outputFile) {
          buttons.push(
            h(NButton, {
              size: 'small',
              type: 'success',
              ghost: true,
              onClick: () => downloadOutputFile(row.result?.outputFile || null),
              title: 'Download processed result file'
            }, {
              default: () => '📤 Result',
              icon: () => h('span', '📊')
            })
          )
        }
        */

        return h('div', { class: 'flex gap-1 flex-wrap' }, buttons)
      }
    }
  }
]

// Refresh data function
async function refreshData() {
  // Refresh data from API
  await loadRecentUploads()
  await fetchJobs()
}

// Show job details
function showJobDetails(job: typeof selectedJob.value) {
  if (job?.type === 'job') {
    selectedJob.value = job
    showJobDetailsModal.value = true
  }
}

// Helper functions for modal
function getStatusType(status: string) {
  const statusMap = {
    'completed': 'success',
    'running': 'info',
    'pending': 'warning',
    'failed': 'error',
    'cancelled': 'default'
  } as const
  return statusMap[status as keyof typeof statusMap] || 'default'
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString()
}

function calculateDuration(startTime: string, endTime: string) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const durationMs = end.getTime() - start.getTime()
  const minutes = Math.floor(durationMs / 60000)
  const seconds = Math.floor((durationMs % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

// Download original uploaded file
async function downloadOriginalFile(jobId: string, originalFileName?: string) {
  try {
    const result = await jobApi.downloadOriginalFile(jobId)
    if (result.success && result.data) {
      const { blob, fileName } = result.data
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = originalFileName || fileName
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      message.success('Original file downloaded successfully')
    } else {
      message.error(result.error || 'Failed to download original file')
    }
  } catch (error) {
    console.error('Download error:', error)
    message.error('Failed to download original file')
  }
}

// Download output file - DISABLED (Backend doesn't support this yet)
// TODO: Enable when backend adds download-result endpoint
async function downloadOutputFile(outputFile: string | null) {
  message.warning('Download result file is not supported yet. Only original files can be downloaded.')
  return
  
  /* 
  // This code will work when backend supports downloading result/output files
  if (outputFile) {
    try {
      // Extract jobId from outputFile if needed, or use a different approach
      const jobIdMatch = outputFile.match(/job_(\d+)/)
      const jobId = jobIdMatch ? jobIdMatch[1] : '0'

      const result = await jobApi.downloadResultFile(jobId || '0')
      if (result.success && result.data) {
        const { blob, fileName } = result.data
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
        message.success('Output file downloaded successfully')
      } else {
        message.error(result.error || 'Failed to download output file')
      }
    } catch (error) {
      console.error('Download error:', error)
      message.error('Failed to download output file')
    }
  }
  */
}

// Load recent uploads from API
async function loadRecentUploads() {
  // Remove mock data - all upload history is now tracked through jobs API
  recentUploads.value = []
}

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
      .then((response: { success: boolean, rowsCount?: number, message?: string, jobId?: string }) => {
        const fileIndex = uploadProgress.value.findIndex(f => f.id === uploadFile.id)
        if (fileIndex !== -1 && uploadProgress.value[fileIndex]) {
          if (response.success) {
            uploadProgress.value[fileIndex]!.progress = 100
            uploadProgress.value[fileIndex]!.status = 'success'
            message.success(`✅ ${file.name} uploaded successfully! ${response.rowsCount} rows processed.`)

            // Refresh jobs to show the new job
            setTimeout(() => {
              fetchJobs()
            }, 1000)
          } else {
            uploadProgress.value[fileIndex]!.status = 'error'
            message.error(`❌ Upload failed: ${response.message}`)
          }
        }
      })
      .catch((error: Error) => {
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
  // Upload is handled in beforeUpload, this is just for fallback
  message.success(`${options.file.name} uploaded successfully`)
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
  const headers = Object.keys(exampleData[0] || {})
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

// Watch for pagination changes to refetch data (with debounce to avoid multiple calls)
let fetchTimeout: number | null = null
watch([currentPage, pageSize], () => {
  if (fetchTimeout) {
    clearTimeout(fetchTimeout)
  }
  fetchTimeout = setTimeout(() => {
    // Only fetch jobs if we're viewing jobs or all
    if (viewFilter.value === 'jobs' || viewFilter.value === 'all') {
      fetchJobs()
    }
  }, 100) // 100ms debounce
})

// Watch for view filter changes
watch(viewFilter, (newFilter) => {
  // Reset to first page when changing view
  currentPage.value = 1

  // Fetch jobs if switching to jobs or all view
  if (newFilter === 'jobs' || newFilter === 'all') {
    fetchJobs()
  }
})

// Initialize data when component mounts
onMounted(async () => {
  await loadRecentUploads()
  await fetchJobs()
})
</script>
