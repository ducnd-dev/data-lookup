<template>
  <PageWrapper>
    <div class="space-y-8">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="mt-2 text-sm text-gray-700">Welcome back! Here's what's happening with your data.</p>
        </div>
        <n-button type="primary" size="large" @click="refreshData" :loading="loadingStats">
          <template #icon>
            <n-icon>
              <Refresh />
            </n-icon>
          </template>
          Refresh Data
        </n-button>
      </div>

      <!-- Stats Cards -->
      <n-spin :show="loadingStats">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <n-card class="stat-card">
            <div class="flex items-center">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-600">Total Users</p>
                <p class="text-3xl font-bold text-blue-600">{{ formatNumber(stats.totalUsers) }}</p>
                <p class="text-xs" :class="getGrowthColor(stats.userGrowth)">
                  {{ getGrowthText(stats.userGrowth) }} from last month
                </p>
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
                <p class="text-3xl font-bold text-green-600">{{ formatNumber(stats.activeJobs) }}</p>
                <p class="text-xs" :class="getGrowthColor(stats.jobGrowth)">
                  {{ getGrowthText(stats.jobGrowth) }} from last month
                </p>
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
                <p class="text-3xl font-bold text-purple-600">{{ formatNumber(stats.dataRecords) }}</p>
                <p class="text-xs" :class="getGrowthColor(stats.recordGrowth)">
                  {{ getGrowthText(stats.recordGrowth) }} from last month
                </p>
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
                <p class="text-3xl font-bold text-orange-600">{{ formatNumber(stats.uploadsToday) }}</p>
                <p class="text-xs" :class="getGrowthColor(stats.uploadGrowth)">
                  {{ getGrowthText(stats.uploadGrowth) }} from yesterday
                </p>
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
      </n-spin>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import PageWrapper from '@/components/common/PageWrapper.vue'
import { CloudUpload, Person, Search, BusinessSharp as Work, Refresh } from '@vicons/ionicons5'
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { apiCall } from '@/services/api'

const message = useMessage()

// Loading states
const loadingStats = ref(false)

// Data interfaces
interface DashboardStats {
  totalUsers: number
  activeJobs: number
  dataRecords: number
  uploadsToday: number
  userGrowth: number
  jobGrowth: number
  recordGrowth: number
  uploadGrowth: number
}

// Data
const stats = ref<DashboardStats>({
  totalUsers: 0,
  activeJobs: 0,
  dataRecords: 0,
  uploadsToday: 0,
  userGrowth: 0,
  jobGrowth: 0,
  recordGrowth: 0,
  uploadGrowth: 0
})

// Format number for display
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Get growth color based on percentage
const getGrowthColor = (growth: number): string => {
  if (growth > 0) return 'text-green-600'
  if (growth < 0) return 'text-red-600'
  return 'text-gray-600'
}

// Get growth text with arrow
const getGrowthText = (growth: number): string => {
  if (growth > 0) return `↗ +${growth}%`
  if (growth < 0) return `↘ ${growth}%`
  return '→ 0%'
}

// Fetch dashboard stats
const fetchStats = async () => {
  loadingStats.value = true
  try {
    const response = await apiCall<DashboardStats>({
      method: 'GET',
      url: '/dashboard/stats'
    })

    if (response.success) {
      stats.value = response.data
    } else {
      message.error(response.error || 'Failed to load dashboard stats')
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    message.error('Error loading dashboard stats')
  } finally {
    loadingStats.value = false
  }
}

// Refresh all data
const refreshData = async () => {
  await fetchStats()
  message.success('Dashboard data refreshed')
}

// Initialize data on mount
onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.stat-card {
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}
</style>
