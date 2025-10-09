import { useCallback } from 'react'
import { apiClient } from '@/utils/api'

export const useApi = () => {
  const makeRequest = useCallback(async (
    url: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
      data?: unknown
      skipAuth?: boolean
    } = {}
  ) => {
    const { method = 'GET', data, skipAuth = false } = options

    try {
      let response: Response

      switch (method) {
        case 'GET':
          response = await apiClient.get(url, { skipAuth })
          break
        case 'POST':
          response = await apiClient.post(url, data, { skipAuth })
          break
        case 'PUT':
          response = await apiClient.put(url, data, { skipAuth })
          break
        case 'DELETE':
          response = await apiClient.delete(url, { skipAuth })
          break
        default:
          throw new Error(`Unsupported method: ${method}`)
      }

      const result = await response.json()
      return { success: true, data: result, status: response.status }
    } catch (error) {
      console.error('API request failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0
      }
    }
  }, [])

  return { makeRequest }
}

export default useApi