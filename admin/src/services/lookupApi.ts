import { apiCall } from './api'

export type LookupColumnKey = string // You might want to define specific column types based on your backend

export interface QueryLookupRequest {
  colName: LookupColumnKey
  values: string[]
  searchMode?: 'exact' | 'partial' | 'fuzzy'
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}

export interface CreateReportRequest {
  colName: LookupColumnKey
  values: string[]
}

export interface BulkSearchRequest {
  searchTerms: string[]
  colName?: LookupColumnKey
  searchMode?: 'exact' | 'partial' | 'fuzzy'
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}

export interface AdvancedBulkSearchRequest {
  searchQueries: {
    colName: LookupColumnKey
    values: string[]
    searchMode?: 'exact' | 'partial' | 'fuzzy'
  }[]
  operator?: 'AND' | 'OR'
  page?: number
  limit?: number
}

export interface ExportSearchResultsRequest {
  colName: LookupColumnKey
  values: string[]
  searchMode?: 'exact' | 'partial' | 'fuzzy'
  searchType?: 'single' | 'bulk'
}

export interface LookupResult {
  id: string
  [key: string]: unknown // Dynamic fields based on lookup data
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface JobStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  result?: unknown
  error?: string
  createdAt: string
  updatedAt: string
}

export const lookupApi = {
  // Query lookup data by column and values
  queryLookup: async (request: QueryLookupRequest) => {
    return await apiCall<PaginatedResponse<LookupResult>>({
      method: 'POST',
      url: '/lookup/query',
      data: request,
    })
  },

  // Get lookup by ID
  getLookupById: async (id: string) => {
    return await apiCall<LookupResult>({
      method: 'GET',
      url: `/lookup/${id}`,
    })
  },

  // Create lookup report
  createReport: async (request: CreateReportRequest) => {
    return await apiCall<{ jobId: string }>({
      method: 'POST',
      url: '/lookup/report',
      data: request,
    })
  },

  // Get job status
  getJobStatus: async (jobId: string) => {
    return await apiCall<JobStatus>({
      method: 'GET',
      url: `/lookup/job/${jobId}`,
    })
  },

  // List user jobs
  listJobs: async (page: number = 1, limit: number = 10) => {
    return await apiCall<PaginatedResponse<JobStatus>>({
      method: 'GET',
      url: '/lookup/jobs',
      params: { page, limit },
    })
  },

  // Export lookup data
  exportLookupData: async (request: CreateReportRequest) => {
    return await apiCall<{ jobId: string }>({
      method: 'POST',
      url: '/lookup/export',
      data: request,
    })
  },

  // Bulk search lookup data
  bulkSearch: async (request: BulkSearchRequest) => {
    return await apiCall<PaginatedResponse<LookupResult>>({
      method: 'POST',
      url: '/lookup/bulk-search',
      data: request,
    })
  },

  // Advanced bulk search
  advancedBulkSearch: async (request: AdvancedBulkSearchRequest) => {
    return await apiCall<PaginatedResponse<LookupResult>>({
      method: 'POST',
      url: '/lookup/advanced-bulk-search',
      data: request,
    })
  },

  // Bulk search export
  bulkSearchExport: async (request: BulkSearchRequest) => {
    return await apiCall<{ jobId: string }>({
      method: 'POST',
      url: '/lookup/bulk-search-export',
      data: request,
    })
  },

  // Export search results (immediate export)
  exportSearchResults: async (request: ExportSearchResultsRequest) => {
    return await apiCall<{
      success: boolean;
      data: LookupResult[];
      total: number;
      exportType: string;
      searchMode: string;
      searchColumn: string;
      searchValues?: string[];
      searchTerms?: string[];
    }>({
      method: 'POST',
      url: '/lookup/export-search-results',
      data: request,
    })
  },
}
