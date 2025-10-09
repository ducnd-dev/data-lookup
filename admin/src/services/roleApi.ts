import { apiCall } from './api'

export interface Role {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  permissions?: Permission[]
}

export interface Permission {
  id: number
  name: string
  description?: string
}

export interface CreateRoleRequest {
  name: string
  description?: string
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
}

export interface AssignPermissionRequest {
  permissionId: number
}

export interface RolePaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const roleApi = {
  // Get all roles with pagination
  getRoles: async (page: number = 1, limit: number = 10) => {
    return await apiCall<RolePaginatedResponse<Role>>({
      method: 'GET',
      url: '/roles',
      params: { page, limit },
    })
  },

  // Get role by ID
  getRoleById: async (id: number) => {
    return await apiCall<Role>({
      method: 'GET',
      url: `/roles/${id}`,
    })
  },

  // Create new role
  createRole: async (roleData: CreateRoleRequest) => {
    return await apiCall<Role>({
      method: 'POST',
      url: '/roles',
      data: roleData,
    })
  },

  // Update role
  updateRole: async (id: number, roleData: UpdateRoleRequest) => {
    return await apiCall<Role>({
      method: 'PUT',
      url: `/roles/${id}`,
      data: roleData,
    })
  },

  // Delete role
  deleteRole: async (id: number) => {
    return await apiCall<{ message: string }>({
      method: 'DELETE',
      url: `/roles/${id}`,
    })
  },

  // Assign permission to role
  assignPermission: async (roleId: number, permissionId: number) => {
    return await apiCall<{ message: string }>({
      method: 'POST',
      url: `/roles/${roleId}/permissions`,
      data: { permissionId },
    })
  },

  // Remove permission from role
  removePermission: async (roleId: number, permissionId: number) => {
    return await apiCall<{ message: string }>({
      method: 'DELETE',
      url: `/roles/${roleId}/permissions/${permissionId}`,
    })
  },

  // Search roles (if needed)
  searchRoles: async (query: string, page: number = 1, limit: number = 10) => {
    return await apiCall<RolePaginatedResponse<Role>>({
      method: 'GET',
      url: '/roles',
      params: { 
        page, 
        limit,
        search: query 
      },
    })
  },
}