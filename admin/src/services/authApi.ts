import { apiCall } from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  fullName: string
}

export interface AuthResponse {
  access_token: string
  user: {
    id: number
    email: string
    fullName: string
  }
}

export const authApi = {
  // Login user
  login: async (credentials: LoginCredentials) => {
    const result = await apiCall<AuthResponse>({
      method: 'POST',
      url: '/auth/login',
      data: credentials,
    })

    if (result.success && result.data) {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', result.data.access_token)
      // Store user info
      localStorage.setItem('user', JSON.stringify(result.data.user))
    }

    return result
  },

  // Register new user
  register: async (data: RegisterData) => {
    return await apiCall<AuthResponse>({
      method: 'POST',
      url: '/auth/register',
      data,
    })
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  },

  // Get current user from localStorage
  getCurrentUserFromStorage: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return false
    
    try {
      // Decode JWT to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      
      if (payload.exp && payload.exp < currentTime) {
        // Token is expired, remove it
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        return false
      }
      
      return true
    } catch (error) {
      // Invalid token format
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      return false
    }
  },

  // Get current user from server
  getCurrentUser: async () => {
    return await apiCall<{ user: any }>({
      method: 'GET',
      url: '/auth/me',
    })
  },
}
