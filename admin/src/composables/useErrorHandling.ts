import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function useErrorHandling() {
  const message = useMessage()
  const router = useRouter()
  const authStore = useAuthStore()

  const handleApiError = (error: any, customMessages?: { [key: number]: string }) => {
    if (!error.response) {
      message.error('Network error. Please check your connection.')
      return
    }

    const status = error.response.status
    const serverMessage = error.response.data?.message

    switch (status) {
      case 401:
        // Session expired, redirect to login
        message.warning('Your session has expired. Please login again.')
        authStore.logout()
        router.push('/login')
        break
      
      case 403:
        // Permission denied
        const permissionMsg = customMessages?.[403] || 
          serverMessage || 
          'You do not have permission to access this resource'
        message.error(permissionMsg)
        break
      
      case 404:
        message.error(customMessages?.[404] || 'Resource not found')
        break
      
      case 422:
        // Validation errors
        message.error(serverMessage || 'Invalid data provided')
        break
      
      case 429:
        message.warning('Too many requests. Please wait and try again.')
        break
      
      case 500:
        message.error('Server error. Please try again later.')
        break
      
      default:
        message.error(customMessages?.[status] || serverMessage || `Error ${status}`)
    }
  }

  const handlePermissionError = (requiredPermission: string) => {
    message.error(`Permission required: ${requiredPermission}`)
  }

  const showAccessDenied = (resource?: string) => {
    const resourceMsg = resource ? ` for ${resource}` : ''
    message.error(`Access denied${resourceMsg}. Contact your administrator if you need access.`)
  }

  return {
    handleApiError,
    handlePermissionError,
    showAccessDenied
  }
}