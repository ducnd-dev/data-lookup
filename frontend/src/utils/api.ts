// API utility with automatic 401 handling

interface ApiOptions extends RequestInit {
  skipAuth?: boolean
}

class ApiClient {
  private static instance: ApiClient
  private logoutCallback?: () => void

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  public setLogoutCallback(callback: () => void) {
    this.logoutCallback = callback
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token')
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      }
    }
    return {}
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Token expired or invalid
      console.log('401 Unauthorized - clearing auth data')
      
      // Clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Call logout callback to update context
      if (this.logoutCallback) {
        this.logoutCallback()
      }
      
      // Show notification (you can replace with your preferred notification system)
      console.warn('Session expired. Redirecting to login...')
      
      // Redirect to login page
      window.location.href = '/login'
      
      throw new Error('Unauthorized')
    }
    
    return response
  }

  public async fetch(url: string, options: ApiOptions = {}): Promise<Response> {
    const { skipAuth = false, ...fetchOptions } = options
    
    const headers = {
      'Content-Type': 'application/json',
      ...(!skipAuth && this.getAuthHeaders()),
      ...fetchOptions.headers,
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  public async get(url: string, options: ApiOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: 'GET' })
  }

  public async post(url: string, data?: unknown, options: ApiOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  public async put(url: string, data?: unknown, options: ApiOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  public async delete(url: string, options: ApiOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: 'DELETE' })
  }
}

export const apiClient = ApiClient.getInstance()
export default apiClient