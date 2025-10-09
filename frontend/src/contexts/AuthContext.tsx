'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface UserRole {
  role: {
    id: number
    name: string
    description?: string
    rolePermissions?: Array<{
      permission: {
        id: number
        name: string
        description?: string
      }
    }>
  }
}

interface User {
  id: string
  name: string
  email: string
  phone?: string
  roles?: UserRole[]
  permissions?: string[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user && !!token

  // Khởi tạo auth state từ localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')
        
        if (savedToken && savedUser) {
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        // Xóa dữ liệu lỗi
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Hàm đăng nhập
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const { token: newToken, user: newUser } = data
        
        // Lưu vào state
        setToken(newToken)
        setUser(newUser)
        
        // Lưu vào localStorage
        localStorage.setItem('token', newToken)
        localStorage.setItem('user', JSON.stringify(newUser))
        
        console.log('Login successful, user:', newUser)
        return { success: true }
      } else {
        console.error('Login failed:', data)
        return { 
          success: false, 
          message: data.message || 'Đăng nhập thất bại' 
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        message: 'Có lỗi xảy ra trong quá trình đăng nhập' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm đăng ký
  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        return { success: true }
      } else {
        return { 
          success: false, 
          message: result.message || 'Đăng ký thất bại' 
        }
      }
    } catch (error) {
      console.error('Register error:', error)
      return { 
        success: false, 
        message: 'Có lỗi xảy ra trong quá trình đăng ký' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm đăng xuất
  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }, [router])

  // Hàm refresh thông tin user
  const refreshUser = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      } else {
        // Token không hợp lệ, đăng xuất
        logout()
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }, [token, logout])

  // Auto refresh user info khi có token
  useEffect(() => {
    if (token && !user) {
      refreshUser()
    }
  }, [token, user, refreshUser])

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook để sử dụng AuthContext
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook để kiểm tra quyền
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading }
}