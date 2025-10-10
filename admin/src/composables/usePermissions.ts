import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function usePermissions() {
  const authStore = useAuthStore()

  // Get current user's permissions
  const userPermissions = computed(() => {
    try {
      const user = authStore.user
      if (!user || !user.roles) return []

      // Extract permissions from user's roles
      const permissions: string[] = []
      user.roles.forEach(userRole => {
        // Add null-safe checks for nested properties
        if (userRole?.role?.rolePermissions) {
          userRole.role.rolePermissions.forEach(rp => {
            // Add null-safe check for permission object
            if (rp?.permission?.name && !permissions.includes(rp.permission.name)) {
              permissions.push(rp.permission.name)
            }
          })
        }
      })
      return permissions
    } catch (error) {
      console.warn('Error getting user permissions:', error)
      return []
    }
  })

  // Get current user's roles
  const userRoles = computed(() => {
    try {
      const user = authStore.user
      if (!user || !user.roles) return []
      return user.roles.map(userRole => userRole?.role?.name).filter(Boolean)
    } catch (error) {
      console.warn('Error getting user roles:', error)
      return []
    }
  })

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    return userPermissions.value.includes(permission)
  }

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  // Check if user has all specified permissions
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    return userRoles.value.includes(role)
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  // Check if user can upload files
  const canUpload = computed(() => {
    return hasPermission('UPLOAD_FILES') || hasAnyRole(['Admin', 'Manager'])
  })

  // Check if user can manage users
  const canManageUsers = computed(() => {
    return hasPermission('WRITE_USERS') || hasRole('Admin')
  })

  // Check if user can manage roles
  const canManageRoles = computed(() => {
    return hasPermission('MANAGE_ROLES') || hasRole('Admin')
  })

  // Check if user can access settings
  const canManageSettings = computed(() => {
    return hasPermission('MANAGE_SETTINGS') || hasRole('Admin')
  })

  return {
    userPermissions,
    userRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    canUpload,
    canManageUsers,
    canManageRoles,
    canManageSettings
  }
}
