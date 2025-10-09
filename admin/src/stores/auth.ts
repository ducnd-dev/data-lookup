import { authApi, type LoginCredentials, type RegisterData } from '@/services'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface UserRole {
  role: Role
}

export interface Role {
  id: number
  name: string
  description: string
  rolePermissions?: RolePermission[]
}

export interface RolePermission {
  permission: Permission
}

export interface Permission {
  id: number
  name: string
  description: string
}

export interface User {
  id: number
  email: string
  fullName: string
  roles?: UserRole[]
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && authApi.isAuthenticated())
  const userName = computed(() => user.value?.fullName)

  // Actions
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authApi.login(credentials)

      if (result.success && result.data) {
        user.value = result.data.user
        return { success: true }
      } else {
        // Handle specific error types
        if (result.error && (result.error.indexOf('401') !== -1 || result.error.indexOf('Invalid credentials') !== -1)) {
          error.value = 'Invalid email or password'
        } else if (result.error && result.error.indexOf('403') !== -1) {
          error.value = 'Access denied. Your account may be disabled.'
        } else {
          error.value = result.error || 'Login failed'
        }
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = 'Connection error. Please try again.'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (data: RegisterData) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await authApi.register(data)

      if (result.success && result.data) {
        user.value = result.data.user
        return { success: true }
      } else {
        error.value = result.error || 'Registration failed'
        return { success: false, error: error.value }
      }
    } catch {
      error.value = 'An unexpected error occurred'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    error.value = null
    authApi.logout()
  }

  const initializeAuth = async () => {
    // Check if user is already logged in on app start
    const token = localStorage.getItem('accessToken')
    console.log('Auth Store - Initializing auth, token exists:', !!token)
    
    if (token && authApi.isAuthenticated()) {
      console.log('Auth Store - Token valid, fetching user data from server')
      try {
        // Get fresh user data from server
        const result = await authApi.getCurrentUser()
        if (result.success && result.data) {
          user.value = result.data.user
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(result.data.user))
          console.log('Auth Store - User data loaded from server:', result.data.user.email)
        } else {
          console.log('Auth Store - Server request failed, clearing auth data')
          // Token is invalid, clear auth data
          logout()
        }
      } catch (error) {
        console.log('Auth Store - Error fetching user data, falling back to localStorage')
        // Error getting user data, fall back to localStorage
        const localUser = authApi.getCurrentUserFromStorage()
        if (localUser) {
          user.value = localUser
          console.log('Auth Store - User data loaded from localStorage:', localUser.email)
        } else {
          console.log('Auth Store - No local user data, logging out')
          logout()
        }
      }
    } else {
      console.log('Auth Store - No valid token, user not authenticated')
    }
  }

  const refreshCurrentUser = async () => {
    if (!authApi.isAuthenticated()) return { success: false, error: 'Not authenticated' }
    
    try {
      const result = await authApi.getCurrentUser()
      if (result.success && result.data) {
        user.value = result.data.user
        localStorage.setItem('user', JSON.stringify(result.data.user))
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to refresh user data' }
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    user,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    userName,
    // Actions
    login,
    register,
    logout,
    initializeAuth,
    refreshCurrentUser,
    clearError,
  }
})
