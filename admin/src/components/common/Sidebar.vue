<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Logo/Title Section -->
    <div class="flex items-center px-6 py-6 border-b border-gray-100">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <n-icon size="18" color="white">
            <DatabaseOutline />
          </n-icon>
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-900">Data Lookup</h1>
          <p class="text-xs text-gray-500">Management System</p>
        </div>
      </div>
    </div>

    <!-- Navigation Menu -->
    <div class="flex-1 overflow-y-auto">
      <n-menu
        :key="menuKey"
        :value="activeKey"
        :options="menuOptions"
        :indent="24"
        @update:value="handleMenuSelect"
      />
    </div>

    <!-- Footer/User Section -->
    <div class="px-6 py-4 border-t border-gray-100">
      <div class="text-xs text-gray-400 text-center">
        v1.0.0 • © 2024
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BriefcaseIcon,
  DashboardIcon,
  FileSearchIcon,
  ShieldIcon,
  UploadIcon,
  UserIcon
} from '@/components/common/Icons.vue'
import { usePermissions } from '@/composables/usePermissions'
import { useAuthStore } from '@/stores/auth'
import { ServerOutline as DatabaseOutline } from '@vicons/ionicons5'
import type { MenuOption } from 'naive-ui'
import { computed, watchEffect, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { canUpload, canManageUsers, canManageRoles, hasAnyRole } = usePermissions()

// Force re-render trigger
const menuTrigger = ref(0)

// Force re-render key when user changes
const menuKey = computed(() => {
  return `menu-${authStore.user?.id || 'guest'}-${menuTrigger.value}`
})

const activeKey = computed(() => {
  if (route.path === '/') {
    return 'dashboard'
  }
  return route.name as string
})

const allMenuOptions: MenuOption[] = [
  {
    label: 'Dashboard',
    key: 'dashboard',
    icon: DashboardIcon
  },
  {
    label: 'Data Lookup',
    key: 'lookup',
    icon: FileSearchIcon
  },
  {
    label: 'Upload Data',
    key: 'upload',
    icon: UploadIcon
  },
  {
    label: 'Job Management',
    key: 'jobs',
    icon: BriefcaseIcon
  },
  {
    label: 'User Management',
    key: 'users',
    icon: UserIcon
  },
  {
    label: 'Role Management',
    key: 'roles',
    icon: ShieldIcon
  }
]

// Filter menu options based on user permissions
const menuOptions = computed(() => {
  const filteredOptions: MenuOption[] = []

  // Debug: Log current user state
  console.log('🔍 Menu rebuild - Auth state:', {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    userRoles: authStore.user?.roles?.map(ur => ur.role?.name),
    canUpload: canUpload.value,
    canManageUsers: canManageUsers.value,
    canManageRoles: canManageRoles.value
  })

  // Always show Data Lookup for all users
  const dataLookupOption = allMenuOptions.find(option => option.key === 'lookup')
  if (dataLookupOption) {
    filteredOptions.push(dataLookupOption)
  }

  // Show Dashboard for Admin and Manager roles
  if (hasAnyRole(['Admin', 'Manager'])) {
    const dashboardOption = allMenuOptions.find(option => option.key === 'dashboard')
    if (dashboardOption) {
      filteredOptions.unshift(dashboardOption) // Add at beginning
    }
  }

  // Show Upload Data for users with upload permission
  if (canUpload.value) {
    const uploadOption = allMenuOptions.find(option => option.key === 'upload')
    if (uploadOption) {
      filteredOptions.push(uploadOption)
    }
  }

  // Show Job Management for Admin and Manager roles
  if (hasAnyRole(['Admin', 'Manager'])) {
    const jobsOption = allMenuOptions.find(option => option.key === 'jobs')
    if (jobsOption) {
      filteredOptions.push(jobsOption)
    }
  }

  // Show User Management for users with user management permission
  if (canManageUsers.value) {
    const usersOption = allMenuOptions.find(option => option.key === 'users')
    if (usersOption) {
      filteredOptions.push(usersOption)
    }
  }

  // Show Role Management for users with role management permission
  if (canManageRoles.value) {
    const rolesOption = allMenuOptions.find(option => option.key === 'roles')
    if (rolesOption) {
      filteredOptions.push(rolesOption)
    }
  }

  return filteredOptions
})

// Force reactivity when auth state changes
watchEffect(() => {
  if (authStore.user) {
    console.log('👤 User changed, menu should update:', authStore.user.fullName)
    // Force menu re-render
    menuTrigger.value++
  }
})

const handleMenuSelect = (key: string) => {
  if (key === 'dashboard') {
    router.push('/')
  } else {
    router.push({ name: key })
  }
}
</script>
