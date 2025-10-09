<template>
  <PageWrapper>
    <div class="space-y-8">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="mt-2 text-sm text-gray-700">Welcome back! Here's what's happening with your data.</p>
        </div>
        <n-button type="primary" size="large">
          <template #icon>
            <n-icon>
              <Add />
            </n-icon>
          </template>
          Quick Action
        </n-button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <n-card class="stat-card">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Total Users</p>
              <p class="text-3xl font-bold text-blue-600">1,234</p>
              <p class="text-xs text-green-600 mt-1">↗ +12% from last month</p>
            </div>
            <div class="ml-4 flex-shrink-0">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <n-icon size="24" color="#3b82f6">
                  <Person />
                </n-icon>
              </div>
            </div>
          </div>
        </n-card>

        <n-card class="stat-card">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Active Jobs</p>
              <p class="text-3xl font-bold text-green-600">56</p>
              <p class="text-xs text-green-600 mt-1">↗ +8% from last month</p>
            </div>
            <div class="ml-4 flex-shrink-0">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <n-icon size="24" color="#10b981">
                  <Work />
                </n-icon>
              </div>
            </div>
          </div>
        </n-card>

        <n-card class="stat-card">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Data Records</p>
              <p class="text-3xl font-bold text-purple-600">89.2K</p>
              <p class="text-xs text-red-600 mt-1">↘ -3% from last month</p>
            </div>
            <div class="ml-4 flex-shrink-0">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <n-icon size="24" color="#8b5cf6">
                  <Search />
                </n-icon>
              </div>
            </div>
          </div>
        </n-card>

        <n-card class="stat-card">
          <div class="flex items-center">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600">Uploads Today</p>
              <p class="text-3xl font-bold text-orange-600">12</p>
              <p class="text-xs text-green-600 mt-1">↗ +25% from yesterday</p>
            </div>
            <div class="ml-4 flex-shrink-0">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <n-icon size="24" color="#f59e0b">
                  <CloudUpload />
                </n-icon>
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <n-card title="Monthly Activity" class="chart-card">
          <template #header-extra>
            <n-select v-model:value="chartPeriod" :options="periodOptions" size="small" style="width: 120px" />
          </template>
          <div class="h-80 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
            <div class="text-center">
              <n-icon size="48" color="#d1d5db">
                <TrendingUpOutline />
              </n-icon>
              <p class="mt-2">Chart integration area</p>
              <p class="text-sm">Connect your preferred chart library</p>
            </div>
          </div>
        </n-card>

        <n-card title="Recent Activities" class="activity-card">
          <template #header-extra>
            <n-button text size="small">View All</n-button>
          </template>
          <div class="space-y-4">
            <div v-for="item in recentActivities" :key="item.id"
              class="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
              <n-avatar round size="small" :style="{ backgroundColor: item.color }" class="flex-shrink-0 mt-1">
                {{ item.initials }}
              </n-avatar>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">{{ item.title }}</p>
                <p class="text-sm text-gray-500">{{ item.description }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatTime(item.timestamp) }}</p>
              </div>
              <n-tag size="small" :type="item.type">
                {{ item.status }}
              </n-tag>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Quick Actions -->
      <n-card title="Quick Actions">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <button v-for="action in quickActions" :key="action.id"
            class="flex flex-col items-center p-4 text-center rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            @click="handleQuickAction(action.action)">
            <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
              <n-icon size="20" :color="action.color">
                <component :is="action.icon" />
              </n-icon>
            </div>
            <span class="text-sm font-medium text-gray-900">{{ action.label }}</span>
          </button>
        </div>
      </n-card>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import PageWrapper from '@/components/common/PageWrapper.vue'
import { Add, CloudUpload, DocumentTextOutline, DownloadOutline, Person, PersonAddOutline, RefreshOutline, Search, SettingsOutline, TrendingUpOutline, BusinessSharp as Work, Refresh } from '@vicons/ionicons5'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessage } from 'naive-ui'

const authStore = useAuthStore()
const message = useMessage()
const refreshingUser = ref(false)

const chartPeriod = ref('month')
const periodOptions = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Quarter', value: 'quarter' },
  { label: 'Year', value: 'year' }
]

const recentActivities = ref([
  {
    id: 1,
    title: 'New user registered',
    description: 'John Smith joined the platform',
    initials: 'JS',
    color: '#3b82f6',
    timestamp: new Date().getTime() - 1000 * 60 * 5,
    type: 'success',
    status: 'New'
  },
  {
    id: 2,
    title: 'Data upload completed',
    description: 'Employee data batch processed successfully',
    initials: 'DU',
    color: '#10b981',
    timestamp: new Date().getTime() - 1000 * 60 * 15,
    type: 'info',
    status: 'Complete'
  },
  {
    id: 3,
    title: 'Job status updated',
    description: 'Background job #1234 completed',
    initials: 'BJ',
    color: '#f59e0b',
    timestamp: new Date().getTime() - 1000 * 60 * 30,
    type: 'warning',
    status: 'Updated'
  },
  {
    id: 4,
    title: 'System maintenance',
    description: 'Scheduled maintenance completed',
    initials: 'SM',
    color: '#8b5cf6',
    timestamp: new Date().getTime() - 1000 * 60 * 60,
    type: 'default',
    status: 'Done'
  }
])

const quickActions = ref([
  {
    id: 1,
    label: 'Add User',
    icon: PersonAddOutline,
    color: '#3b82f6',
    action: 'add-user'
  },
  {
    id: 2,
    label: 'Upload Data',
    icon: CloudUpload,
    color: '#10b981',
    action: 'upload-data'
  },
  {
    id: 3,
    label: 'Generate Report',
    icon: DocumentTextOutline,
    color: '#f59e0b',
    action: 'generate-report'
  },
  {
    id: 4,
    label: 'Settings',
    icon: SettingsOutline,
    color: '#8b5cf6',
    action: 'settings'
  },
  {
    id: 5,
    label: 'Export Data',
    icon: DownloadOutline,
    color: '#ef4444',
    action: 'export-data'
  },
  {
    id: 6,
    label: 'Refresh',
    icon: RefreshOutline,
    color: '#06b6d4',
    action: 'refresh'
  }
])

const formatTime = (timestamp: number) => {
  const now = new Date().getTime()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Refresh user data function
const refreshUserData = async () => {
  refreshingUser.value = true
  try {
    const result = await authStore.refreshCurrentUser()
    if (result.success) {
      message.success('User data refreshed successfully')
    } else {
      message.error(result.error || 'Failed to refresh user data')
    }
  } catch (error) {
    message.error('Error refreshing user data')
  } finally {
    refreshingUser.value = false
  }
}

const handleQuickAction = (action: string) => {
  console.log('Quick action:', action)
  // Handle quick actions
}
</script>

<style scoped>
.stat-card {
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.chart-card,
.activity-card {
  min-height: 400px;
}
</style>
