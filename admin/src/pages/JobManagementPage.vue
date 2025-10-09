<template>
  <PageWrapper>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Job Management</h1>
          <p class="mt-2 text-sm text-gray-700">Monitor and manage system jobs and processes</p>
        </div>
        <div class="flex gap-3">
          <n-button type="primary" size="large" @click="showCreateJobModal = true">
            <template #icon>
              <n-icon>
                <Add />
              </n-icon>
            </template>
            Create Job
          </n-button>
          <n-button size="large" @click="refreshJobs">
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>
            Refresh
          </n-button>
        </div>
      </div>

      <!-- Job Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <n-card>
          <n-statistic label="Total Jobs" :value="jobStats.total">
            <template #prefix>
              <n-icon class="text-blue-500">
                <Briefcase />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>

        <n-card>
          <n-statistic label="Running" :value="jobStats.running">
            <template #prefix>
              <n-icon class="text-green-500">
                <Play />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>

        <n-card>
          <n-statistic label="Completed" :value="jobStats.completed">
            <template #prefix>
              <n-icon class="text-purple-500">
                <CheckmarkCircle />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>

        <n-card>
          <n-statistic label="Failed" :value="jobStats.failed">
            <template #prefix>
              <n-icon class="text-red-500">
                <CloseCircle />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>
      </div>

      <!-- Job Templates -->
      <n-card title="Job Templates" v-if="jobTemplates.length > 0">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="template in jobTemplates"
            :key="template.id"
            class="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
            @click="createFromTemplate(template)"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <n-icon size="24" :class="getTemplateIconColor(template.type)">
                  <component :is="getTemplateIcon(template.icon)" />
                </n-icon>
                <div>
                  <h4 class="font-semibold text-gray-900">{{ template.name }}</h4>
                  <n-tag size="small" :type="getTypeTagColor(template.type)">
                    {{ template.type.toUpperCase() }}
                  </n-tag>
                </div>
              </div>
            </div>

            <p class="text-sm text-gray-600 mb-3">{{ template.description }}</p>

            <div class="space-y-2">
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <n-icon size="14"><Time /></n-icon>
                <span>{{ template.estimatedTime }}</span>
              </div>

              <div class="flex flex-wrap gap-1">
                <n-tag
                  v-for="feature in template.features.slice(0, 2)"
                  :key="feature"
                  size="tiny"
                  type="info"
                >
                  {{ feature }}
                </n-tag>
                <n-tag
                  v-if="template.features.length > 2"
                  size="tiny"
                  type="default"
                >
                  +{{ template.features.length - 2 }}
                </n-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 text-center">
          <n-button secondary @click="loadTemplates">
            <template #icon>
              <n-icon><Refresh /></n-icon>
            </template>
            Refresh Templates
          </n-button>
        </div>
      </n-card>

      <!-- Quick Start -->
      <n-card title="Quick Start" v-if="quickStartJobs.length > 0">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="quickJob in quickStartJobs"
            :key="quickJob.id"
            class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
            @click="executeQuickStart(quickJob)"
          >
            <n-icon size="32" class="text-blue-500 mb-2">
              <component :is="getTemplateIcon(getQuickStartIcon(quickJob.type))" />
            </n-icon>
            <h4 class="font-semibold mb-2">{{ quickJob.name }}</h4>
            <p class="text-sm text-gray-600 mb-3">{{ quickJob.description }}</p>
            <n-tag size="small" type="warning">{{ quickJob.estimatedTime }}</n-tag>
          </div>
        </div>
      </n-card>

      <!-- Filter and Search -->
      <n-card>
        <n-form inline :label-width="80">
          <n-form-item label="Status">
            <n-select v-model:value="filters.status" placeholder="All Status" :options="statusOptions" clearable
              style="width: 150px" />
          </n-form-item>
          <n-form-item label="Type">
            <n-select v-model:value="filters.type" placeholder="All Types" :options="typeOptions" clearable
              style="width: 150px" />
          </n-form-item>
          <n-form-item label="Search">
            <n-input v-model:value="filters.search" placeholder="Search jobs..." clearable style="width: 200px" />
          </n-form-item>
          <n-form-item>
            <n-button type="primary" @click="applyFilters">Filter</n-button>
          </n-form-item>
        </n-form>
      </n-card>

      <!-- Jobs Table -->
      <n-card title="Jobs">
        <n-data-table
          :columns="jobColumns"
          :data="filteredJobs"
          :pagination="{
            page: pagination.page,
            pageSize: pagination.pageSize,
            showSizePicker: true,
            pageSizes: [10, 15, 20, 50],
            showQuickJumper: true,
            onUpdatePage: (page: number) => {
              pagination.page = page
              fetchJobs()
            },
            onUpdatePageSize: (pageSize: number) => {
              pagination.pageSize = pageSize
              pagination.page = 1
              fetchJobs()
            }
          }"
          :loading="jobsLoading || loading"
        />
      </n-card>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-blue-500 mb-4">
              <CloudUpload />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">Data Import</h3>
            <p class="text-gray-600 text-sm mb-4">
              Import data from external sources
            </p>
            <n-button type="primary" size="small" @click="createJob('import')">
              Start Import
            </n-button>
          </div>
        </n-card>

        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-green-500 mb-4">
              <Download />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">Data Export</h3>
            <p class="text-gray-600 text-sm mb-4">
              Export data to various formats
            </p>
            <n-button type="primary" size="small" @click="createJob('export')">
              Start Export
            </n-button>
          </div>
        </n-card>

        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-purple-500 mb-4">
              <Sync />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">Data Sync</h3>
            <p class="text-gray-600 text-sm mb-4">
              Synchronize data between systems
            </p>
            <n-button type="primary" size="small" @click="createJob('sync')">
              Start Sync
            </n-button>
          </div>
        </n-card>

        <n-card>
          <div class="text-center">
            <n-icon size="48" class="text-orange-500 mb-4">
              <Analytics />
            </n-icon>
            <h3 class="text-lg font-semibold mb-2">Analysis</h3>
            <p class="text-gray-600 text-sm mb-4">
              Run data analysis and reporting
            </p>
            <n-button type="primary" size="small" @click="createJob('analysis')">
              Start Analysis
            </n-button>
          </div>
        </n-card>
      </div>

      <!-- Create Job Modal -->
      <n-modal v-model:show="showCreateJobModal" preset="dialog" title="Create New Job">
        <n-form ref="createJobFormRef" :model="newJob" :rules="jobRules" label-placement="top">
          <n-form-item label="Job Name" path="name">
            <n-input v-model:value="newJob.name" placeholder="Enter job name" />
          </n-form-item>
          <n-form-item label="Job Type" path="type">
            <n-select v-model:value="newJob.type" placeholder="Select job type" :options="typeOptions" />
          </n-form-item>
          <n-form-item label="Description" path="description">
            <n-input v-model:value="newJob.description" type="textarea" placeholder="Enter job description"
              :autosize="{ minRows: 3, maxRows: 6 }" />
          </n-form-item>
          <n-form-item label="Schedule" path="schedule">
            <n-select v-model:value="newJob.schedule" placeholder="Select schedule" :options="scheduleOptions" />
          </n-form-item>
        </n-form>
        <template #action>
          <div class="flex justify-end gap-3">
            <n-button @click="showCreateJobModal = false">Cancel</n-button>
            <n-button type="primary" @click="createNewJob">Create Job</n-button>
          </div>
        </template>
      </n-modal>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import {
  Add,
  Analytics,
  Briefcase,
  CheckmarkCircle, CloseCircle, CloudUpload,
  Download,
  Eye,
  Play,
  Refresh,
  Search,
  Stop,
  Sync,
  Time,
  Trash
} from '@vicons/ionicons5'
import {
  NButton,
  NCard,
  NDataTable,
  NForm, NFormItem,
  NIcon,
  NInput,
  NModal,
  NProgress,
  NSelect,
  NStatistic,
  NTag,
  useMessage, type DataTableColumns
} from 'naive-ui'
import { computed, h, ref } from 'vue'
import PageWrapper from '../components/common/PageWrapper.vue'
import { jobApi, type Job, type CreateJobDto, type JobQuery } from '@/services/jobApi'
import { useApi } from '@/composables/useApi'

const message = useMessage()

// API composables
const {
  data: jobsData,
  loading: jobsLoading,
  execute: fetchJobs
} = useApi(() => jobApi.getJobs(queryParams.value))

const {
  data: jobStatsData,
  loading: statsLoading,
  execute: fetchJobStats
} = useApi(() => jobApi.getJobStats())

const {
  loading: createLoading,
  execute: createJobApi
} = useApi((jobData: CreateJobDto) => jobApi.createJob(jobData))

const {
  loading: deleteLoading,
  execute: deleteJobApi
} = useApi((id: string) => jobApi.deleteJob(id))

const {
  loading: cancelLoading,
  execute: cancelJobApi
} = useApi((id: string) => jobApi.cancelJob(id))

const {
  data: templatesData,
  loading: templatesLoading,
  execute: loadTemplates
} = useApi(() => jobApi.getJobTemplates())

const {
  data: quickStartData,
  loading: quickStartLoading,
  execute: loadQuickStart
} = useApi(() => jobApi.getQuickStartJobs())

const {
  loading: templateCreateLoading,
  execute: createFromTemplateApi
} = useApi((templateId: string, name?: string) => jobApi.createFromTemplate(templateId, name))

const {
  loading: quickStartExecuteLoading,
  execute: executeQuickStartApi
} = useApi((action: string) => jobApi.executeQuickStart(action))

// State
const loading = ref(false)
const showCreateJobModal = ref(false)
const createJobFormRef = ref()

// Pagination
const pagination = ref({
  page: 1,
  pageSize: 15
})

// Computed data with fallback
const jobs = computed(() => jobsData.value?.data?.jobs || [])
const jobStats = computed(() => {
  const stats = jobStatsData.value?.data || { total: 0, byStatus: { running: 0, completed: 0, failed: 0, pending: 0, cancelled: 0 }, byType: {}, recent: [], activeJobs: 0 }
  return {
    total: stats.total,
    running: stats.byStatus.running,
    completed: stats.byStatus.completed,
    failed: stats.byStatus.failed,
    pending: stats.byStatus.pending
  }
})

// Templates and quick start data
const jobTemplates = computed(() => templatesData.value?.data || [])
const quickStartJobs = computed(() => quickStartData.value?.data || [])

// Query parameters
const queryParams = computed<JobQuery>(() => ({
  page: pagination.value.page,
  limit: pagination.value.pageSize,
  status: filters.value.status || undefined,
  type: filters.value.type || undefined,
  search: filters.value.search || undefined,
  sortBy: 'createdAt',
  sortOrder: 'desc'
}))

// Filters
const filters = ref({
  status: null,
  type: null,
  search: ''
})

// New job form
const newJob = ref({
  name: '',
  type: '',
  description: '',
  schedule: ''
})

// Options
const statusOptions = [
  { label: 'Running', value: 'running' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Cancelled', value: 'cancelled' }
]

const typeOptions = [
  { label: 'Import', value: 'import' },
  { label: 'Export', value: 'export' },
  { label: 'Sync', value: 'sync' },
  { label: 'Analysis', value: 'analysis' }
]

const scheduleOptions = [
  { label: 'Run Once', value: 'once' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' }
]

// Form rules
const jobRules = {
  name: {
    required: true,
    message: 'Please input job name',
    trigger: ['input', 'blur']
  },
  type: {
    required: true,
    message: 'Please select job type',
    trigger: ['change', 'blur']
  }
}

// Computed
const filteredJobs = computed(() => {
  const jobs = jobsData.value?.data?.jobs || []
  return jobs.filter(job => {
    if (filters.value.status && job.status !== filters.value.status) return false
    if (filters.value.type && job.type !== filters.value.type) return false
    if (filters.value.search && !job.name.toLowerCase().includes(filters.value.search.toLowerCase())) return false
    return true
  })
})

// Table columns
const jobColumns: DataTableColumns<Job> = [
  {
    title: 'Name',
    key: 'name',
    render: (row) => h('div', [
      h('div', { class: 'font-medium' }, row.name),
      h('div', { class: 'text-sm text-gray-500' }, row.description)
    ])
  },
  {
    title: 'Type',
    key: 'type',
    render: (row) => h(NTag, { type: getTypeTagColor(row.type) }, { default: () => row.type.toUpperCase() })
  },
  {
    title: 'Status',
    key: 'status',
    render: (row) => h(NTag, { type: getStatusTagColor(row.status) }, { default: () => row.status.toUpperCase() })
  },
  {
    title: 'Progress',
    key: 'progress',
    render: (row: Job) => h(NProgress, {
      type: 'line',
      percentage: row.progress || 0,
      status: row.status === 'failed' ? 'error' : row.status === 'completed' ? 'success' : 'info'
    })
  },
  {
    title: 'Created',
    key: 'createdAt'
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (row) => h('div', { class: 'flex space-x-2' }, [
      h(NButton, {
        size: 'small',
        onClick: () => viewJob(row)
      }, {
        default: () => 'View',
        icon: () => h(NIcon, null, { default: () => h(Eye) })
      }),
      ...(row.status === 'running' ? [
        h(NButton, {
          size: 'small',
          type: 'warning',
          onClick: () => stopJob(row)
        }, {
          default: () => 'Stop',
          icon: () => h(NIcon, null, { default: () => h(Stop) })
        })
      ] : []),
      h(NButton, {
        size: 'small',
        type: 'error',
        onClick: () => deleteJob(row)
      }, {
        default: () => 'Delete',
        icon: () => h(NIcon, null, { default: () => h(Trash) })
      })
    ])
  }
]

// Methods
function getStatusTagColor(status: string): 'info' | 'success' | 'error' | 'warning' | 'default' {
  const colorMap: Record<string, 'info' | 'success' | 'error' | 'warning' | 'default'> = {
    'running': 'info',
    'completed': 'success',
    'failed': 'error',
    'pending': 'warning',
    'cancelled': 'default'
  }
  return colorMap[status] || 'default'
}

function getTypeTagColor(type: string): 'info' | 'success' | 'error' | 'warning' | 'primary' | 'default' {
  const colorMap: Record<string, 'info' | 'success' | 'error' | 'warning' | 'primary' | 'default'> = {
    'import': 'info',
    'export': 'success',
    'sync': 'warning',
    'analysis': 'primary'
  }
  return colorMap[type] || 'default'
}

function refreshJobs() {
  fetchJobs()
  fetchJobStats()
  message.success('Jobs refreshed')
}

function applyFilters() {
  fetchJobs()
  message.info('Filters applied')
}

function createJob(type: string) {
  newJob.value.type = type
  showCreateJobModal.value = true
}

function createNewJob() {
  createJobFormRef.value?.validate(async (errors?: unknown) => {
    if (!errors) {
      try {
        const jobData: CreateJobDto = {
          name: newJob.value.name,
          jobType: newJob.value.type as Job['type'],
          description: newJob.value.description
        }

        const response = await createJobApi(jobData)
        if (response.success) {
          message.success('Job created successfully')
          showCreateJobModal.value = false
          resetForm()
          await fetchJobs()
          await fetchJobStats()
        } else {
          message.error(response.error || 'Failed to create job')
        }
      } catch (error) {
        console.error('Error creating job:', error)
        message.error('Failed to create job')
      }
    }
  })
}

function resetForm() {
  newJob.value = {
    name: '',
    type: '',
    description: '',
    schedule: ''
  }
}

function viewJob(job: Job) {
  message.info(`Viewing job: ${job.name}`)
}

async function stopJob(job: Job) {
  try {
    const response = await cancelJobApi(job.id)
    if (response.success) {
      message.success(`Job ${job.name} cancelled`)
      await fetchJobs()
      await fetchJobStats()
    } else {
      message.error('Failed to cancel job')
    }
  } catch (error) {
    console.error('Error cancelling job:', error)
    message.error('Failed to cancel job')
  }
}

async function deleteJob(job: Job) {
  try {
    const response = await deleteJobApi(job.id)
    if (response.success) {
      message.success(`Job ${job.name} deleted`)
      await fetchJobs()
      await fetchJobStats()
    } else {
      message.error('Failed to delete job')
    }
  } catch (error) {
    console.error('Error deleting job:', error)
    message.error('Failed to delete job')
  }
}

// Template management functions
function getTemplateIcon(iconName: string) {
  const iconMap: Record<string, any> = {
    CloudUpload,
    Search,
    Download,
    Analytics,
    Sync,
    CleaningServices: Analytics // fallback
  }
  return iconMap[iconName] || Analytics
}

function getTemplateIconColor(type: string) {
  const colorMap: Record<string, string> = {
    import: 'text-blue-500',
    search: 'text-green-500',
    export: 'text-purple-500',
    analysis: 'text-orange-500',
    sync: 'text-yellow-500',
    processing: 'text-red-500'
  }
  return colorMap[type] || 'text-gray-500'
}

function getQuickStartIcon(type: string) {
  const iconMap: Record<string, string> = {
    import: 'CloudUpload',
    search: 'Search',
    export: 'Download'
  }
  return iconMap[type] || 'Analytics'
}

async function createFromTemplate(template: any) {
  try {
    const response = await createFromTemplateApi(template.id)
    if (response.success) {
      message.success(`Job created from template: ${template.name}`)
      await fetchJobs()
      await fetchJobStats()
    } else {
      message.error('Failed to create job from template')
    }
  } catch (error) {
    console.error('Error creating job from template:', error)
    message.error('Failed to create job from template')
  }
}

async function executeQuickStart(quickJob: any) {
  try {
    const response = await executeQuickStartApi(quickJob.action)
    if (response.success) {
      message.success(`Quick start job created: ${quickJob.name}`)
      await fetchJobs()
      await fetchJobStats()
    } else {
      message.error('Failed to execute quick start job')
    }
  } catch (error) {
    console.error('Error executing quick start:', error)
    message.error('Failed to execute quick start job')
  }
}

// Initialize data when component mounts
import { onMounted } from 'vue'

onMounted(() => {
  fetchJobs()
  fetchJobStats()
  loadTemplates()
  loadQuickStart()
})
</script>
