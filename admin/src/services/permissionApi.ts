import { apiCall } from './api'

export interface Permission {
  id: number
  name: string
  description?: string
}

export interface CreatePermissionRequest {
  name: string
  description?: string
}

export interface UpdatePermissionRequest {
  name?: string
  description?: string
}

export interface PermissionPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const permissionApi = {
  // Get all permissions with pagination
  getPermissions: async (page: number = 1, limit: number = 100) => {
    return await apiCall<PermissionPaginatedResponse<Permission>>({
      method: 'GET',
      url: '/permissions',
      params: { page, limit },
    })
  },

  // Get permission by ID
  getPermissionById: async (id: number) => {
    return await apiCall<Permission>({
      method: 'GET',
      url: `/permissions/${id}`,
    })
  },

  // Create new permission
  createPermission: async (permissionData: CreatePermissionRequest) => {
    return await apiCall<Permission>({
      method: 'POST',
      url: '/permissions',
      data: permissionData,
    })
  },

  // Update permission
  updatePermission: async (id: number, permissionData: UpdatePermissionRequest) => {
    return await apiCall<Permission>({
      method: 'PUT',
      url: `/permissions/${id}`,
      data: permissionData,
    })
  },

  // Delete permission
  deletePermission: async (id: number) => {
    return await apiCall<{ message: string }>({
      method: 'DELETE',
      url: `/permissions/${id}`,
    })
  },

  // Search permissions (if needed)
  searchPermissions: async (query: string, page: number = 1, limit: number = 100) => {
    return await apiCall<PermissionPaginatedResponse<Permission>>({
      method: 'GET',
      url: '/permissions',
      params: { 
        page, 
        limit,
        search: query 
      },
    })
  },
}