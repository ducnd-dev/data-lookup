import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { title: 'Login', requiresAuth: false },
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/pages/DashboardPage.vue'),
          meta: { title: 'Dashboard', requiresRoles: ['Admin', 'Manager'] },
        },
        {
          path: '/dashboard',
          redirect: '/',
        },
        {
          path: '/users',
          name: 'users',
          component: () => import('@/pages/UserManagementPage.vue'),
          meta: { title: 'User Management', requiresPermissions: ['WRITE_USERS'] },
        },
        {
          path: '/data-lookup',
          name: 'lookup',
          component: () => import('@/pages/DataLookupPage.vue'),
          meta: { title: 'Data Lookup' }, // No restrictions - available to all users
        },
        {
          path: '/upload',
          name: 'upload',
          component: () => import('@/pages/UploadPage.vue'),
          meta: { title: 'Upload & Jobs', requiresPermissions: ['UPLOAD_FILES'] },
        },
        {
          path: '/roles',
          name: 'roles',
          component: () => import('@/pages/RoleManagementPage.vue'),
          meta: { title: 'Role Management', requiresPermissions: ['MANAGE_ROLES'] },
        },
        {
          path: '/settings',
          name: 'settings',
          component: () => import('@/pages/SettingsPage.vue'),
          meta: { title: 'System Settings', requiresPermissions: ['MANAGE_SETTINGS'] },
        },
      ],
    },
  ],
})

// Auth guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Initialize auth on first run
  if (!authStore.user) {
    await authStore.initializeAuth()
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    // Clear any stale auth data
    authStore.logout()
    next('/login')
    return
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    // Redirect authenticated users away from login page to data lookup
    next('/data-lookup')
    return
  }

  // Permission checks for authenticated users
  if (authStore.isAuthenticated && to.meta.requiresAuth !== false) {
    const { hasAnyRole, hasAnyPermission } = usePermissions()

    // Check role requirements
    if (to.meta.requiresRoles) {
      const requiredRoles = to.meta.requiresRoles as string[]
      if (!hasAnyRole(requiredRoles)) {
        // Redirect to data lookup page if user doesn't have required roles
        next('/data-lookup')
        return
      }
    }

    // Check permission requirements
    if (to.meta.requiresPermissions) {
      const requiredPermissions = to.meta.requiresPermissions as string[]
      if (!hasAnyPermission(requiredPermissions)) {
        // Redirect to data lookup page if user doesn't have required permissions
        next('/data-lookup')
        return
      }
    }

    // Special case: redirect regular users from root path to data lookup
    if (to.path === '/' && !hasAnyRole(['Admin', 'Manager'])) {
      next('/data-lookup')
      return
    }
  }

  next()
})

export default router
