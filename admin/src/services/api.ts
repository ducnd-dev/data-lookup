import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

// Base API URL - you can change this to match your backend URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - automatically add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    console.log('API Request - Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.warn('No auth token found in localStorage')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle common response scenarios
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 errors (unauthorized - token expired/invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Clear tokens and redirect to login
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      console.log('401 Unauthorized - redirecting to login')

      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        console.warn('Session expired. Redirecting to login...')
        window.location.href = '/login'
      }
    }

    // Handle 403 errors (forbidden - insufficient permissions)
    if (error.response?.status === 403) {
      console.error('Permission denied:', error.response?.data?.message || 'Insufficient permissions')
      // The component can handle this error appropriately
    }

    return Promise.reject(error)
  }
)

// Helper function for making API calls with better error handling
export const apiCall = async <T = any>(
  config: AxiosRequestConfig
) => {
  try {
    const response = await api(config)
    return { data: response.data, success: true }
  } catch (error: any) {
    let errorMessage = 'An error occurred'

    if (error.response) {
      const status = error.response.status
      const responseMessage = error.response.data?.message

      switch (status) {
        case 401:
          errorMessage = 'Your session has expired. Please login again.'
          break
        case 403:
          errorMessage = responseMessage || 'You do not have permission to access this resource'
          break
        case 404:
          errorMessage = 'Resource not found'
          break
        case 500:
          errorMessage = 'Internal server error. Please try again later.'
          break
        default:
          errorMessage = responseMessage || `Error ${status}: ${error.message}`
      }
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error. Please check your connection.'
    } else {
      errorMessage = error.message || 'An unexpected error occurred'
    }

    console.error('API call failed:', errorMessage, error)
    return { data: null as any, success: false, error: errorMessage }
  }
}

// Helper function for downloading files with proper headers and authentication
export const apiDownload = async (url: string) => {
  try {
    const response = await api({
      method: 'GET',
      url,
      responseType: 'blob'
    })

    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition']
    let fileName = 'download'

    console.log('Content-Disposition header:', contentDisposition)

    if (contentDisposition) {
      // Try multiple patterns for filename extraction
      // Pattern 1: filename="something.ext"
      let matches = contentDisposition.match(/filename="([^"]+)"/)
      if (!matches) {
        // Pattern 2: filename=something.ext (without quotes)
        matches = contentDisposition.match(/filename=([^;]+)/)
      }
      if (!matches) {
        // Pattern 3: filename*=UTF-8''encoded-filename
        matches = contentDisposition.match(/filename\*=UTF-8''([^;]+)/)
        if (matches && matches[1]) {
          // URL decode the filename
          fileName = decodeURIComponent(matches[1])
        }
      }
      if (matches && matches[1] && !fileName.includes('download')) {
        fileName = matches[1].trim()
      }
    }

    console.log('Extracted filename:', fileName)

    return {
      success: true,
      data: {
        blob: response.data,
        fileName,
        headers: response.headers
      }
    }
  } catch (error: any) {
    let errorMessage = 'Download failed'

    if (error.response) {
      const status = error.response.status
      const responseMessage = error.response.data?.message

      switch (status) {
        case 401:
          errorMessage = 'Your session has expired. Please login again.'
          break
        case 403:
          errorMessage = 'You do not have permission to download this file'
          break
        case 404:
          errorMessage = 'File not found'
          break
        default:
          errorMessage = responseMessage || `Download error ${status}`
      }
    }

    console.error('Download failed:', errorMessage, error)
    return { success: false, error: errorMessage }
  }
}

export default api
