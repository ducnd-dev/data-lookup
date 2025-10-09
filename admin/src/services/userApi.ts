import { apiCall } from './api'

export interface User {
  id: number
  email: string
  fullName?: string
  isActive?: boolean
  createdAt: string
  updatedAt: string
  roles?: UserRole[]
  permissions?: string[]
}

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

export interface CreateUserRequest {
  email: string
  fullName: string
  password: string
  roleIds?: number[]
}

export interface UpdateUserRequest {
  email?: string
  fullName?: string
  isActive?: boolean
  roleIds?: number[]
}

export interface AssignRoleRequest {
  roleId: number
}

export interface UserPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UserFilters {
  search?: string
  status?: 'active' | 'inactive'
  roleId?: number
  createdFrom?: string
  createdTo?: string
  sortBy?: 'fullName' | 'email' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export const userApi = {
  // Get all users with pagination and filters
  getUsers: async (page: number = 1, limit: number = 10, filters?: UserFilters) => {
    const params: Record<string, string | number> = { page, limit }

    if (filters) {
      if (filters.search) params.search = filters.search
      if (filters.status) params.status = filters.status
      if (filters.roleId) params.roleId = filters.roleId
      if (filters.createdFrom) params.createdFrom = filters.createdFrom
      if (filters.createdTo) params.createdTo = filters.createdTo
      if (filters.sortBy) params.sortBy = filters.sortBy
      if (filters.sortOrder) params.sortOrder = filters.sortOrder
    }

    return await apiCall<UserPaginatedResponse<User>>({
      method: 'GET',
      url: '/users',
      params,
    })
  },

  // Get user by ID
  getUserById: async (id: number) => {
    return await apiCall<User>({
      method: 'GET',
      url: `/users/${id}`,
    })
  },

  // Create new user (through auth/register endpoint)
  createUser: async (userData: CreateUserRequest) => {
    return await apiCall<User>({
      method: 'POST',
      url: '/auth/register',
      data: userData,
    })
  },

  // Update user (would need additional endpoint in backend)
  updateUser: async (id: number, userData: UpdateUserRequest) => {
    return await apiCall<User>({
      method: 'PUT',
      url: `/users/${id}`,
      data: userData,
    })
  },

  // Delete user
  deleteUser: async (id: number) => {
    return await apiCall<{ message: string }>({
      method: 'DELETE',
      url: `/users/${id}`,
    })
  },

  // Assign role to user
  assignRole: async (userId: number, roleId: number) => {
    return await apiCall<{ message: string }>({
      method: 'POST',
      url: `/users/${userId}/roles`,
      data: { roleId },
    })
  },

  // Remove role from user
  removeRole: async (userId: number, roleId: number) => {
    return await apiCall<{ message: string }>({
      method: 'DELETE',
      url: `/users/${userId}/roles/${roleId}`,
    })
  },

  // Toggle user status (active/inactive)
  toggleStatus: async (userId: number) => {
    return await apiCall<User>({
      method: 'PUT',
      url: `/users/${userId}/toggle-status`,
    })
  },

  // Export users
  exportUsers: async (page: number = 1, limit: number = 1000) => {
    return await apiCall<{ downloadUrl: string }>({
      method: 'POST',
      url: '/users/export',
      params: { page, limit },
    })
  },

  // Search users (if needed)
  searchUsers: async (query: string, page: number = 1, limit: number = 10) => {
    return await apiCall<UserPaginatedResponse<User>>({
      method: 'GET',
      url: '/users',
      params: {
        page,
        limit,
        search: query
      },
    })
  },
}
