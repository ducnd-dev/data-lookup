import { apiCall } from './api'

// Job interfaces
export interface Job {
  id: string
  name: string
  type: 'upload' | 'search' | 'export' | 'import' | 'processing'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress?: number
  description?: string
  startTime?: string
  endTime?: string
  createdBy: string
  result?: {
    recordsProcessed?: number
    recordsSuccessful?: number
    recordsFailed?: number
    outputFile?: string
    errorMessage?: string
  }
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface JobQuery {
  page?: number
  limit?: number
  status?: Job['status']
  type?: Job['type']
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  createdBy?: string
}

export interface CreateJobDto {
  name: string
  type: Job['type']
  description?: string
  metadata?: Record<string, any>
}

export interface UpdateJobDto {
  name?: string
  description?: string
  status?: Job['status']
  progress?: number
  result?: Job['result']
  metadata?: Record<string, any>
}

// Job API functions
export const jobApi = {
  // Get all jobs with pagination and filtering
  async getJobs(query: JobQuery = {}) {
    const searchParams = new URLSearchParams()

    if (query.page) searchParams.set('page', query.page.toString())
    if (query.limit) searchParams.set('limit', query.limit.toString())
    if (query.status) searchParams.set('status', query.status)
    if (query.type) searchParams.set('type', query.type)
    if (query.search) searchParams.set('search', query.search)
    if (query.sortBy) searchParams.set('sortBy', query.sortBy)
    if (query.sortOrder) searchParams.set('sortOrder', query.sortOrder)
    if (query.createdBy) searchParams.set('createdBy', query.createdBy)

    const url = `/jobs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

    return await apiCall({
      method: 'GET',
      url
    })
  },

  // Get job by ID
  async getJobById(id: string) {
    return await apiCall({
      method: 'GET',
      url: `/jobs/${id}`
    })
  },

  // Create a new job
  async createJob(jobData: CreateJobDto) {
    return await apiCall({
      method: 'POST',
      url: '/jobs',
      data: jobData
    })
  },

  // Update a job
  async updateJob(id: string, jobData: UpdateJobDto) {
    return await apiCall({
      method: 'PUT',
      url: `/jobs/${id}`,
      data: jobData
    })
  },

  // Delete a job
  async deleteJob(id: string) {
    return await apiCall({
      method: 'DELETE',
      url: `/jobs/${id}`
    })
  },

  // Cancel a job
  async cancelJob(id: string) {
    return await apiCall({
      method: 'POST',
      url: `/jobs/${id}/cancel`
    })
  },

  // Retry a failed job
  async retryJob(id: string) {
    return await apiCall({
      method: 'POST',
      url: `/jobs/${id}/retry`
    })
  },

  // Get job logs
  async getJobLogs(id: string) {
    return await apiCall({
      method: 'GET',
      url: `/jobs/${id}/logs`
    })
  },

  // Get job statistics
  async getJobStats() {
    return await apiCall({
      method: 'GET',
      url: '/jobs/stats'
    })
  },

  // Get job templates
  async getJobTemplates() {
    return await apiCall({
      method: 'GET',
      url: '/jobs/templates/list'
    })
  },

  // Get quick start jobs
  async getQuickStartJobs() {
    return await apiCall({
      method: 'GET',
      url: '/jobs/templates/quickstart'
    })
  },

  // Create job from template
  async createFromTemplate(templateId: string, name?: string) {
    return await apiCall({
      method: 'POST',
      url: '/jobs/templates/create',
      data: { templateId, name }
    })
  },

  // Execute quick start action
  async executeQuickStart(action: string) {
    return await apiCall({
      method: 'POST',
      url: `/jobs/quickstart/${action}`
    })
  },

  // Seed default jobs
  async seedDefaultJobs() {
    return await apiCall({
      method: 'POST',
      url: '/jobs/templates/seed'
    })
  }
}

export default jobApi
