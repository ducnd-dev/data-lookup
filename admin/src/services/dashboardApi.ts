import { apiCall } from './api'

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalFiles: number
  totalJobs: number
  completedJobs: number
  failedJobs: number
  storageUsed: number
  storageLimit: number
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
  }>
}

export interface ActivityLog {
  id: number
  action: string
  user: string
  timestamp: string
  details: string
}

export const dashboardApi = {
  // Get dashboard statistics
  getStats: async () => {
    return await apiCall<DashboardStats>({
      method: 'GET',
      url: '/dashboard/stats',
    })
  },

  // Get user activity chart data
  getUserActivityChart: async (period: 'week' | 'month' | 'year' = 'week') => {
    return await apiCall<ChartData>({
      method: 'GET',
      url: '/dashboard/charts/user-activity',
      params: { period },
    })
  },

  // Get file upload chart data
  getFileUploadChart: async (period: 'week' | 'month' | 'year' = 'week') => {
    return await apiCall<ChartData>({
      method: 'GET',
      url: '/dashboard/charts/file-uploads',
      params: { period },
    })
  },

  // Get job status chart data  
  getJobStatusChart: async () => {
    return await apiCall<ChartData>({
      method: 'GET',
      url: '/dashboard/charts/job-status',
    })
  },

  // Get recent activity logs
  getRecentActivity: async (limit: number = 10) => {
    return await apiCall<ActivityLog[]>({
      method: 'GET',
      url: '/dashboard/activity',
      params: { limit },
    })
  }
}